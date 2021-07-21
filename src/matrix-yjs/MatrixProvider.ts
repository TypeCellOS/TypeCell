import * as _ from "lodash";
import { MatrixClient } from "matrix-js-sdk";
import * as Y from "yjs";
import { decodeBase64, encodeBase64 } from "../matrix-auth/unexported/olmlib";
import { arrayBuffersAreEqual } from "../util/binaryEqual";
import { Emitter, Event } from "../util/vscode-common/event";
import { Disposable } from "../util/vscode-common/lifecycle";
import MatrixReader from "./MatrixReader";
import { sendMessage } from "./matrixUtil";

const FLUSH_INTERVAL = 1000 * 5;

/**
 * Syncs a Matrix room with a Yjs document.
 *
 * Note that when the MatrixClient is a guest-account, we don't receive updates via MatrixProvider, so in that case MatrixProvider
 * is only used to fetch the initial document state.
 *
 * A couple of notes on our MatrixClient:
 * - TypeCell takes care itself of local caching of yjs documents. So all localstorage caches of MatrixClient should be disabled.
 *    so, we've disabled the Matrix IndexedDB store and use a MemoryStore instead.
 *    (otherwise we have both local persistence logic in the matrix client, and in the Yjs doc that's stored via y-indexeddb)
 * - We've also disabled "detached" pendingEventOrdering (use "chronological" instead) for the same reason
 */
export default class MatrixProvider extends Disposable {
  private pendingUpdates: any[] = [];
  private isSendingUpdates = false;
  private roomId: string | undefined;
  private _canWrite: boolean = true;
  private initializeTimeoutHandler: any;
  private retryTimeoutHandler: any;
  private initializedResolve: any;
  private initializedPromise = new Promise<void>((resolve) => {
    this.initializedResolve = resolve;
  });

  private reader: MatrixReader | undefined;

  private readonly _onCanWriteChanged: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onCanWriteChanged: Event<void> =
    this._onCanWriteChanged.event;

  private readonly _onDocumentAvailable: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onDocumentAvailable: Event<void> =
    this._onDocumentAvailable.event;

  private readonly _onDocumentUnavailable: Emitter<void> = this._register(
    new Emitter<void>()
  );

  private readonly _onSentAllEvents: Emitter<void> = this._register(
    new Emitter<void>()
  );

  public readonly onSentAllEvents: Event<void> = this._onSentAllEvents.event;

  private setCanWrite(value: boolean) {
    if (this._canWrite !== value) {
      this._canWrite = value;
      this._onCanWriteChanged.fire();
    }
  }

  public get canWrite() {
    return this._canWrite;
  }

  public readonly onDocumentUnavailable: Event<void> =
    this._onDocumentUnavailable.event;

  public constructor(
    private doc: Y.Doc,
    private matrixClient: MatrixClient,
    private typecellId: string,
    private homeserver: string
  ) {
    super();

    doc.on("update", this.documentUpdateListener);
    this.initialize();
  }

  private documentUpdateListener = async (update: any, origin: any) => {
    if (origin === this) {
      // these are updates that came in from MatrixProvider
      return;
    }
    if (origin?.provider) {
      // update from peer (e.g.: webrtc / websockets). Peer is responsible for sending to Matrix
      return;
    }

    if (this.readOnlyAccess) {
      console.error("received update on readonly doc");
      return;
    }
    this.pendingUpdates.push(update);
    this.throttledFlushUpdatesToMatrix();
  };

  private processIncomingMessages = (messages: any[]) => {
    const updates = messages.map(
      (message) => new Uint8Array(decodeBase64(message.content.body))
    );
    const update = Y.mergeUpdates(updates);

    // Apply latest state from server
    Y.applyUpdate(this.doc, update, this);
    return update;
  };

  private flushUpdatesToMatrix = async () => {
    if (this.isSendingUpdates || !this.pendingUpdates.length) {
      return;
    }

    if (!this.roomId) {
      // we're still initializing. We'll flush updates again once we're initialized
      return;
    }
    this.isSendingUpdates = true;
    const merged = Y.mergeUpdates(this.pendingUpdates);
    this.pendingUpdates = [];
    // const encoder = encoding.createEncoder();
    // encoding.writeVarUint8Array(encoder, merged);
    // encoding.writeVarUint(encoder, 0);
    const str = encodeBase64(merged);

    try {
      await sendMessage(this.matrixClient, this.roomId, str);
      this.setCanWrite(true);
    } catch (e) {
      console.error("error sending updates", e);
      this.pendingUpdates.unshift(merged);
    } finally {
      this.isSendingUpdates = false;
    }

    if (this.pendingUpdates.length) {
      // if new events have been added in the meantime (or we need to retry)
      this.retryTimeoutHandler = setTimeout(
        () => {
          this.throttledFlushUpdatesToMatrix();
        },
        this.canWrite ? DEFAULT_FLUSH_INTERVAL : FORBIDDEN_FLUSH_INTERVAL
      );
    } else {
      this._onSentAllEvents.fire();
    }
    // syncProtocol.writeUpdate(encoder, update);
    // broadcastMessage(this, encoding.toUint8Array(encoder));
  };

  private throttledFlushUpdatesToMatrix = _.throttle(
    this.flushUpdatesToMatrix,
    FLUSH_INTERVAL
  );

  public async waitForFlush() {
    await this.initializedPromise;
    if (!this.pendingUpdates.length) {
      return;
    }
    await Event.toPromise(this.onSentAllEvents);
  }

  public async initializeReader() {
    if (this.reader) {
      throw new Error("already initialized reader");
    }
    if (!this.roomId) {
      throw new Error("no roomId");
    }

    this.reader = this._register(
      new MatrixReader(this.matrixClient, this.roomId)
    );

    this._register(
      this.reader.onMessages((messages) =>
        this.processIncomingMessages(messages)
      )
    );
    const events = await this.reader.getAllInitialEvents();
    this.reader.startPolling();
    return this.processIncomingMessages(events);
  }

  private async initialize() {
    try {
      await this.initializeNoCatch();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async initializeNoCatch() {
    try {
      const ret = await this.matrixClient.getRoomIdForAlias(
        "#" + this.typecellId + ":" + this.homeserver // TODO
      );
      this.roomId = ret.room_id;

      if (!this.matrixClient.isGuest()) {
        // make sure we're in the room, so we keep receiving updates
        // guests can't / won't join, so MatrixProvider won't send updates for this room
        await this.matrixClient.joinRoom(this.roomId);
      }
    } catch (e) {
      let timeout = 5 * 1000;
      if (e.errcode === "M_NOT_FOUND") {
        console.log("room not found", this.typecellId);
        this._onDocumentUnavailable.fire();
      } else if (e.name === "ConnectionError") {
        console.log("room not found (offline)", this.typecellId);
      } else {
        console.error("error retrieving room", this.typecellId, e);
        timeout = 30 * 1000;
        this._onDocumentUnavailable.fire();
      }

      // TODO: current implementation uses polling to get room availability, but should be possible to get a real-time solution
      setTimeout(() => {
        this.initialize();
      }, timeout);
      return;
    }

    let initialLocalState = Y.encodeStateAsUpdate(this.doc);

    // This can fail because of no access to room. Because the room history should always be available,
    // we don't catch this event here
    const update = await this.initializeReader();

    this._onDocumentAvailable.fire();

    // Next, find if there are local changes that haven't been synced to the server
    const remoteStateVector = Y.encodeStateVectorFromUpdate(update);

    const missingOnServer = Y.diffUpdate(initialLocalState, remoteStateVector);

    // missingOnServer will always contain the entire deleteSet on startup.
    // Unfortunately diffUpdate doesn't work well with deletes. In the if-statement
    // below, we try to detect when missingOnServer only contains the deleteSet, with
    // deletes that already exist on the server

    if (
      arrayBuffersAreEqual(deleteSetOnlyUpdate.buffer, missingOnServer.buffer)
    ) {
      // TODO: instead of next 3 lines, we can probably get deleteSet directly from "update"
      let serverDoc = new Y.Doc();
      Y.applyUpdate(serverDoc, update);
      let serverSnapshot = Y.snapshot(serverDoc);
      // TODO: could also compare whether snapshot equal? instead of snapshotContainsAllDeletes?
      if (snapshotContainsAllDeletes(serverSnapshot, oldSnapshot)) {
        // missingOnServer only contains a deleteSet with items that are already in the deleteSet on server
        return;
      }
    }

    if (missingOnServer.length > 2) {
      // TODO: missingOnServer will always send the entire deleteSet on startup.
      // Unfortunately diffUpdate doesn't work well with deletes. Can we improve this?
      this.pendingUpdates.push(missingOnServer);
    }

    // Flush updates that have been made to the yjs document in the mean time,
    // and / or the missingOnServer message from above
    this.throttledFlushUpdatesToMatrix();

    this.initializedResolve();
  }

  public dispose() {
    super.dispose();
    this.reader?.dispose();
    clearTimeout(this.retryTimeoutHandler);
    clearTimeout(this.initializeTimeoutHandler);
    this.throttledFlushUpdatesToMatrix.cancel();
    this.matrixClient.off("Room.timeline", this.processIncomingMessages);
  }
}
