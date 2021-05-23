import { MatrixClient } from "matrix-js-sdk";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as _ from "lodash";
import { encodeBase64, decodeBase64 } from "./unexported/olmlib";

const FLUSH_INTERVAL = 1000 * 5;

/**
 * Syncs a Matrix room with a Yjs document.
 *
 * In our implementation we take care of all the syncing with Matrix. Therefor, we've disabled
 * the Matrix IndexedDB store and use a MemoryStore instead.
 * (otherwise we have both local persistence logic in the matrix client, and in the Yjs doc that's stored via y-indexeddb)
 * We've also disabled "detached" pendingEventOrdering (use "chronological" instead) for the same reason
 */
export default class MatrixProvider {
  private pendingUpdates: any[] = [];
  private isSendingUpdates = false;
  private roomId: string | undefined;

  public constructor(
    private doc: Y.Doc,
    private matrixClient: MatrixClient,
    private typecellId: string
  ) {
    doc.on("update", async (update: any, origin: any) => {
      if (origin === this) {
        // these are updates that came in from MatrixProvider
        return;
      }
      if (origin?.provider) {
        // update from peer (e.g.: webrtc / websockets). Peer is responsible for sending to Matrix
        return;
      }
      this.pendingUpdates.push(update);
      if ((window as any).disable) {
        return;
      }
      this.throttledFlushUpdatesToMatrix();
    });

    matrixClient.on(
      "Room.timeline",
      (event: any, room: any, toStartOfTimeline: boolean) => {
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
      }
    );

    this.initialize();
  }

  private flushUpdatesToMatrix = async () => {
    if (this.isSendingUpdates || !this.pendingUpdates.length || !this.roomId) {
      // TODO: call when roomid is set
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
    } catch (e) {
      console.error("error sending updates", e);
      this.pendingUpdates.unshift(merged);
    } finally {
      this.isSendingUpdates = false;
    }

    if (this.pendingUpdates.length) {
      // if new events have been added in the meantime (or we need to retry)
      setTimeout(() => {
        this.throttledFlushUpdatesToMatrix();
      }, FLUSH_INTERVAL);
    }
    // syncProtocol.writeUpdate(encoder, update);
    // broadcastMessage(this, encoding.toUint8Array(encoder));
  };

  private throttledFlushUpdatesToMatrix = _.throttle(
    this.flushUpdatesToMatrix,
    FLUSH_INTERVAL
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
    // applyupdates (events)
  }

  private getUpdateFromEvent(event: any) {
    // const base64;
    // const decoder = decoding.createDecoder(buf);
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
        "#" + this.typecellId + ":matrix.org" // TODO
      );
      this.roomId = ret.room_id;
    } catch (e) {
      if (e.errcode === "M_NOT_FOUND") {
        const ret = await this.matrixClient.createRoom({
          room_alias_name: this.typecellId,
          visibility: "private",
          name: this.typecellId,
          topic: "",
        });
        this.roomId = ret.room_id;
      } else {
        throw e;
      }
    }

    let initialLocalState = Y.encodeStateAsUpdate(this.doc);

    const update = await this.getExistingStateFromRoom();

    // Apply latest state from server
    Y.applyUpdate(this.doc, update, this);

    // Next, find if there are local changes that haven't been synced to the server
    const remoteStateVector = Y.encodeStateVectorFromUpdate(update);

    const missingOnServer = Y.diffUpdate(initialLocalState, remoteStateVector);

    if (missingOnServer.length < 3) {
      // no differences
      return;
    }

    // TODO: missingOnServer will always send the entire deleteSet on startup.
    // Unfortunately diffUpdate doesn't work well with deletes. Can we improve this?
    this.pendingUpdates.push(missingOnServer);
    this.throttledFlushUpdatesToMatrix();
  }
}
