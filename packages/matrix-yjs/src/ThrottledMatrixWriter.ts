import { base64 } from "@typecell-org/common";
import * as _ from "lodash";
import { MatrixClient } from "matrix-js-sdk";
import { event, lifecycle } from "vscode-lib";
import * as Y from "yjs";
import { sendMessage } from "./matrixUtil";

const DEFAULT_FLUSH_INTERVAL = process.env.NODE_ENV === "test" ? 100 : 1000 * 5;
const FORBIDDEN_FLUSH_INTERVAL = 1000 * 30; // TODO: raise to 1 min

export class ThrottledMatrixWriter extends lifecycle.Disposable {
  private pendingUpdates: any[] = [];
  private isSendingUpdates = false;
  private _canWrite = true;
  private retryTimeoutHandler: any;
  private roomId: string | undefined;

  private readonly _onCanWriteChanged: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onCanWriteChanged: event.Event<void> =
    this._onCanWriteChanged.event;

  private readonly _onSentAllEvents: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );

  private readonly onSentAllEvents: event.Event<void> =
    this._onSentAllEvents.event;

  constructor(private readonly matrixClient: MatrixClient) {
    super();
  }

  private setCanWrite(value: boolean) {
    if (this._canWrite !== value) {
      this._canWrite = value;
      this._onCanWriteChanged.fire();
    }
  }

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
    const str = base64.encodeBase64(merged);
    let retryImmediately = false;
    try {
      console.log("Sending updates");
      await sendMessage(this.matrixClient, this.roomId, str);
      this.setCanWrite(true);
      console.log("sent updates");
    } catch (e: any) {
      if (e.errcode === "M_FORBIDDEN") {
        console.warn("not allowed to edit document", e);
        this.setCanWrite(false);

        try {
          // make sure we're in the room, so we can send updates
          // guests can't / won't join, so MatrixProvider won't send updates for this room
          await this.matrixClient.joinRoom(this.roomId);
          console.log("joined room", this.roomId);
          retryImmediately = true;
        } catch (e) {
          console.warn("failed to join room", e);
        }
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
        retryImmediately
          ? 0
          : this.canWrite
          ? DEFAULT_FLUSH_INTERVAL
          : FORBIDDEN_FLUSH_INTERVAL
      );
    } else {
      console.log("_onSentAllEvents");
      this._onSentAllEvents.fire();
    }
    // syncProtocol.writeUpdate(encoder, update);
    // broadcastMessage(this, encoding.toUint8Array(encoder));
  };

  private throttledFlushUpdatesToMatrix = _.throttle(
    this.flushUpdatesToMatrix,
    this.canWrite ? DEFAULT_FLUSH_INTERVAL : FORBIDDEN_FLUSH_INTERVAL
  );

  public async initialize(roomId: string) {
    this.roomId = roomId;
    this.throttledFlushUpdatesToMatrix();
  }

  public get canWrite() {
    return this._canWrite;
  }

  public writeUpdate(update: any) {
    this.pendingUpdates.push(update);
    this.throttledFlushUpdatesToMatrix();
  }

  public async waitForFlush() {
    if (!this.pendingUpdates.length && !this.isSendingUpdates) {
      return;
    }
    await event.Event.toPromise(this.onSentAllEvents);
  }

  public dispose() {
    super.dispose();
    clearTimeout(this.retryTimeoutHandler);
    this.throttledFlushUpdatesToMatrix.cancel();
  }
}
