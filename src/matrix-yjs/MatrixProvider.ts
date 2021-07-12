import * as _ from "lodash";
import { createClient, MatrixClient } from "matrix-js-sdk";
import * as Y from "yjs";
import { Emitter, Event } from "../util/vscode-common/event";
import { Disposable } from "../util/vscode-common/lifecycle";
import { decodeBase64, encodeBase64 } from "../matrix-auth/unexported/olmlib";
import { arrayBuffersAreEqual } from "../util/binaryEqual";

const DEFAULT_FLUSH_INTERVAL = 1000 * 5;
const FORBIDDEN_FLUSH_INTERVAL = 1000 * 5; // TODO: raise to 1 min

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
    private typecellId: string
  ) {
    super();
    doc.on("update", this.documentUpdateListener);

    // TODO: catch events for when room has been deleted or user has been kicked
    this.matrixClient.on("Room.timeline", this.matrixRoomListener);

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
    this.pendingUpdates.push(update);
    this.throttledFlushUpdatesToMatrix();
  };

  private matrixRoomListener = (
    event: any,
    room: any,
    toStartOfTimeline: boolean
  ) => {
    if (room.roomId !== this.roomId) {
      return;
    }
    if (event.getType() !== "m.room.message") {
      return; // only use messages
    }
    if (!event.event.content?.body) {
      return; // redacted / deleted?
    }
    if (event.status === "sending") {
      return; // event we're sending ourselves
    }

    const update = decodeBase64(event.event.content.body);
    Y.applyUpdate(this.doc, update, this);
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
    const content = {
      body: str,
      msgtype: "m.text",
    };

    try {
      await this.matrixClient.sendEvent(
        this.roomId,
        "m.room.message",
        content,
        ""
      );
      this.setCanWrite(true);
    } catch (e) {
      if (e.errcode === "M_FORBIDDEN") {
        console.warn("not allowed to edit document", e);
        this.setCanWrite(false);
      } else {
        console.error("error sending updates", e);
      }
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
    }
    // syncProtocol.writeUpdate(encoder, update);
    // broadcastMessage(this, encoding.toUint8Array(encoder));
  };

  private throttledFlushUpdatesToMatrix = _.throttle(
    this.flushUpdatesToMatrix,
    this.canWrite ? DEFAULT_FLUSH_INTERVAL : FORBIDDEN_FLUSH_INTERVAL
  );

  public async getEventsAfter(eventId: string | undefined) {
    let ret = {
      startState: undefined,
      updates: [] as any[],
    };
    let token = "";

    let hasNextPage = true;
    while (hasNextPage) {
      let res = await this.matrixClient._createMessagesRequest(
        this.roomId,
        token,
        30,
        "b"
      );
      const events = res.chunk;
      // res.end !== res.start
      for (let i = 0; i < events.length; i++) {
        const event = events[i];

        if (event.type !== "m.room.message") {
          continue;
        }
        if (!event.content?.body) {
          continue; // redacted / deleted?
        }
        if (event.event_id === eventId) {
          return ret;
        }
        ret.updates.push(event);
      }
      token = res.end;
      hasNextPage = res.start !== res.end;
    }
    return ret;
  }

  public async getExistingStateFromRoom() {
    const events = await this.getEventsAfter(undefined);
    const updates = events.updates.map(this.getUpdateFromEvent);
    const update = Y.mergeUpdates(updates);
    return update;
  }

  private getUpdateFromEvent(event: any) {
    const update = new Uint8Array(decodeBase64(event.content.body));
    return update;
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
        "#" + this.typecellId + ":mx.typecell.org" // TODO
      );
      this.roomId = ret.room_id;

      // TODO: we should join the room if we want to send updates
      // if (!this.matrixClient.isGuest()) {
      // make sure we're in the room, so we can send updates
      // guests can't / won't join, so MatrixProvider won't send updates for this room
      // await this.matrixClient.joinRoom(this.roomId);
      // }
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
      this.initializeTimeoutHandler = setTimeout(() => {
        this.initialize();
      }, timeout);
      return;
    }

    let initialLocalState = Y.encodeStateAsUpdate(this.doc);
    const initialLocalStateVector =
      Y.encodeStateVectorFromUpdate(initialLocalState);
    const deleteSetOnlyUpdate = Y.diffUpdate(
      initialLocalState,
      initialLocalStateVector
    );

    let oldSnapshot = Y.snapshot(this.doc);
    // This can fail because of no access to room. Because the room history should always be available,
    // we don't catch this event here
    const update = await this.getExistingStateFromRoom();

    // Apply latest state from server
    Y.applyUpdate(this.doc, update, this);

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

      if (snapshotContainsAllDeletes(serverSnapshot, oldSnapshot)) {
        // missingOnServer only contains a deleteSet with items that are already in the deleteSet on server
        return;
      }
    }

    if (missingOnServer.length > 2) {
      this.pendingUpdates.push(missingOnServer);
    }

    // Flush updates that have been made to the yjs document in the mean time,
    // and / or the missingOnServer message from above
    this.throttledFlushUpdatesToMatrix();
  }

  public dispose() {
    super.dispose();
    clearTimeout(this.retryTimeoutHandler);
    clearTimeout(this.initializeTimeoutHandler);
    this.throttledFlushUpdatesToMatrix.cancel();
    this.doc.off("update", this.documentUpdateListener);
    this.matrixClient.off("Room.timeline", this.matrixRoomListener);
  }
}

// adapted from yjs snapshot equals function
function snapshotContainsAllDeletes(
  newSnapshot: Y.Snapshot,
  oldSnapshot: Y.Snapshot
) {
  // only contains deleteSet
  for (const [client, dsitems1] of oldSnapshot.ds.clients.entries()) {
    const dsitems2 = newSnapshot.ds.clients.get(client) || [];
    if (dsitems1.length > dsitems2.length) {
      return false;
    }
    for (let i = 0; i < dsitems1.length; i++) {
      const dsitem1 = dsitems1[i];
      const dsitem2 = dsitems2[i];
      if (dsitem1.clock !== dsitem2.clock || dsitem1.len !== dsitem2.len) {
        return false;
      }
    }
  }
  return true;
}
