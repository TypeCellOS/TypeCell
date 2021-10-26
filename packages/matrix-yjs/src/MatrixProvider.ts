import { base64, binary } from "@typecell-org/common";
import { MatrixClient } from "matrix-js-sdk";
import { event, lifecycle } from "vscode-lib";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { signObject, verifyObject } from "./authUtil";
import { MatrixMemberReader } from "./MatrixMemberReader";
import { MatrixReader } from "./MatrixReader";
import { SignedWebrtcProvider } from "./SignedWebrtcProvider";
import { ThrottledMatrixWriter } from "./ThrottledMatrixWriter";

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
export class MatrixProvider extends lifecycle.Disposable {
  private disposed = false;
  private roomId: string | undefined;
  private initializeTimeoutHandler: any;

  private initializedResolve: any;

  private readonly initializedPromise = new Promise<void>((resolve) => {
    this.initializedResolve = resolve;
  });

  private webrtcProvider: SignedWebrtcProvider | undefined;
  private reader: MatrixReader | undefined;
  private throttledWriter = new ThrottledMatrixWriter(this.matrixClient);

  private readonly _onDocumentAvailable: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onDocumentAvailable: event.Event<void> =
    this._onDocumentAvailable.event;

  private readonly _onDocumentUnavailable: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );

  private readonly _onReceivedEvents: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );

  public readonly onReceivedEvents: event.Event<void> =
    this._onReceivedEvents.event;

  public readonly onDocumentUnavailable: event.Event<void> =
    this._onDocumentUnavailable.event;

  public readonly onCanWriteChanged = this.throttledWriter.onCanWriteChanged;
  public get canWrite() {
    return this.throttledWriter.canWrite;
  }

  public constructor(
    private doc: Y.Doc,
    private matrixClient: MatrixClient,
    private roomName: string,
    private homeserver: string,
    private readonly awareness?: awarenessProtocol.Awareness
  ) {
    // TODO: check authority of identifier
    super();
    doc.on("update", this.documentUpdateListener);
  }

  private documentUpdateListener = async (update: any, origin: any) => {
    if (
      origin === this ||
      (this.webrtcProvider && origin === this.webrtcProvider)
    ) {
      // these are updates that came in from MatrixProvider
      return;
    }
    if (origin?.provider) {
      // update from peer (e.g.: webrtc / websockets). Peer is responsible for sending to Matrix
      return;
    }
    this.throttledWriter.writeUpdate(update);
    // setTimeout(() => this.throttledWriter.writeUpdate(update), 0); // setTimeout 0 so waitForFlush works if we call it just after setting doc. TODO: necessary?
  };

  private processIncomingMessages = (messages: any[]) => {
    // console.log(
    //   "processIncomingMessages",
    //   JSON.stringify(messages),
    //   messages.length
    // );
    messages = messages.filter((m) => {
      if (m.type !== "m.room.message") {
        return false; // only use messages
      }
      if (!m.content?.body) {
        return false; // redacted / deleted?
      }
      return true;
    });

    const updates = messages.map(
      (message) => new Uint8Array(base64.decodeBase64(message.content.body))
    );
    const update = Y.mergeUpdates(updates);

    // Apply latest state from server
    Y.applyUpdate(this.doc, update, this);

    const remoteMessages = messages.filter(
      (m) => m.user_id !== this.matrixClient.credentials.userId
    );
    if (remoteMessages.length) {
      this._onReceivedEvents.fire();
    }
    return update;
  };

  public async waitForFlush() {
    await this.initializedPromise;
    await this.throttledWriter.waitForFlush();
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

  public async initialize() {
    try {
      await this.initializeNoCatch();
      await this.initializedPromise;
      if (!this.disposed && process.env.NODE_ENV !== "test") {
        await this.initializeWebrtc();
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async initializeWebrtc() {
    if (!this.roomId) {
      throw new Error("not initialized");
    }
    /*
    TODO:
    - implement password

    */
    if (!this.reader) {
      throw new Error("needs reader to initialize webrtc");
    }
    const memberReader = this._register(
      new MatrixMemberReader(this.matrixClient, this.reader)
    );
    await memberReader.initialize();

    // See comments in SignedWebrtcProvider.
    //
    // Security:
    // - We should validate whether the use of Matrix keys and signatures here is considered secure
    this.webrtcProvider = new SignedWebrtcProvider(
      this.doc,
      this.roomId,
      this.roomId,
      async (obj) => {
        await signObject(this.matrixClient, obj);
      },
      async (obj) => {
        await verifyObject(this.matrixClient, memberReader, obj);
      },
      undefined,
      this.awareness
    );
  }

  private async initializeNoCatch() {
    try {
      const ret = await this.matrixClient.getRoomIdForAlias(
        "#" + this.roomName + ":" + this.homeserver // TODO
      );
      this.roomId = ret.room_id;
      if (!this.roomId) {
        throw new Error("error receiving room id");
      }
      console.log("room resolved", this.roomId);
      await this.throttledWriter.initialize(this.roomId);
    } catch (e: any) {
      let timeout = 5 * 1000;
      if (e.errcode === "M_NOT_FOUND") {
        console.log("room not found", this.roomName);
        this._onDocumentUnavailable.fire();
      } else if (e.name === "ConnectionError") {
        console.log("room not found (offline)", this.roomName);
      } else {
        console.error("error retrieving room", this.roomName, e);
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
      binary.arrayBuffersAreEqual(
        deleteSetOnlyUpdate.buffer,
        missingOnServer.buffer
      )
    ) {
      // TODO: instead of next 3 lines, we can probably get deleteSet directly from "update"
      let serverDoc = new Y.Doc();
      Y.applyUpdate(serverDoc, update);
      let serverSnapshot = Y.snapshot(serverDoc);
      // TODO: could also compare whether snapshot equal? instead of snapshotContainsAllDeletes?
      if (snapshotContainsAllDeletes(serverSnapshot, oldSnapshot)) {
        // missingOnServer only contains a deleteSet with items that are already in the deleteSet on server
        this.initializedResolve();
        return;
      }
    }

    if (missingOnServer.length > 2) {
      this.throttledWriter.writeUpdate(missingOnServer);
    }

    this.initializedResolve();
  }

  public dispose() {
    super.dispose();
    this.disposed = true;
    this.webrtcProvider?.destroy();
    this.reader?.dispose();
    clearTimeout(this.initializeTimeoutHandler);
    this.doc.off("update", this.documentUpdateListener);
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
