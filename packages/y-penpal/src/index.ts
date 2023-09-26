/**
 * Based on y-websocket, but with the websocket stuff stripped out and
 * broadcastchannel replaced with handlers that can be connected to penpal / iframe PostMessage
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import { Observable } from "lib0/observable";
import * as authProtocol from "y-protocols/auth";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
export const messageSync = 0;
export const messageQueryAwareness = 3;
export const messageAwareness = 1;
export const messageAuth = 2;

const messageHandlers: any = [];

messageHandlers[messageSync] = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: PenPalProvider,
  emitSynced: boolean,
  _messageType: any,
) => {
  encoding.writeVarUint(encoder, messageSync);
  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    encoder,
    provider.doc,
    provider,
  );
  if (
    emitSynced &&
    syncMessageType === syncProtocol.messageYjsSyncStep2 &&
    !provider.synced
  ) {
    provider.synced = true;
  }
};

messageHandlers[messageQueryAwareness] = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: PenPalProvider,
  emitSynced: boolean,
  _messageType: any,
) => {
  encoding.writeVarUint(encoder, messageAwareness);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(
      provider.awareness,
      Array.from(provider.awareness.getStates().keys()),
    ),
  );
};

messageHandlers[messageAwareness] = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: PenPalProvider,
  emitSynced: boolean,
  _messageType: any,
) => {
  awarenessProtocol.applyAwarenessUpdate(
    provider.awareness,
    decoding.readVarUint8Array(decoder),
    provider,
  );
};

messageHandlers[messageAuth] = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: PenPalProvider,
  emitSynced: boolean,
  _messageType: any,
) => {
  authProtocol.readAuthMessage(decoder, provider.doc, (_ydoc, reason) =>
    console.warn(`Permission denied to access doc.\n${reason}`),
  );
};

const readMessage = (
  provider: PenPalProvider,
  buf: Uint8Array,
  emitSynced: boolean,
) => {
  const decoder = decoding.createDecoder(buf);
  const encoder = encoding.createEncoder();
  const messageType = decoding.readVarUint(decoder);
  const messageHandler = provider.messageHandlers[messageType];
  if (/** @type {any} */ messageHandler) {
    messageHandler(encoder, decoder, provider, emitSynced, messageType);
  } else {
    console.error("Unable to compute message");
  }
  return encoder;
};

/**
 * @param {WebsocketProvider} provider
 * @param {ArrayBuffer} buf
 */
const broadcastMessage = (provider: PenPalProvider, buf: Uint8Array) => {
  if (provider.connected) {
    provider.send(buf, provider);
  }
};

export class PenPalProvider extends Observable<any> {
  public readonly messageHandlers = messageHandlers.slice();
  public connected = false;

  private _synced = false;

  constructor(
    public readonly doc: any,
    public readonly send: (buf: Uint8Array, provider: PenPalProvider) => void,
    public readonly awareness = new awarenessProtocol.Awareness(doc),
    connect = true,
  ) {
    super();

    this.doc.on("update", this._updateHandler);

    if (typeof window !== "undefined") {
      window.addEventListener("unload", this._unloadHandler);
    } else if (typeof process !== "undefined") {
      process.on("exit", this._unloadHandler);
    }
    awareness.on("update", this._awarenessUpdateHandler);

    if (connect) {
      this.connect();
    }
  }

  private _bcSubscriber = (data: ArrayBuffer, origin: any) => {
    if (origin !== this) {
      const encoder = readMessage(this, new Uint8Array(data), false);
      if (encoding.length(encoder) > 1) {
        this.send(encoding.toUint8Array(encoder), this);
      }
    }
  };

  /**
   * Listens to Yjs updates and sends them to peers
   */
  private _updateHandler = (update: Uint8Array, origin: any) => {
    if (origin !== this) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      broadcastMessage(this, encoding.toUint8Array(encoder));
    }
  };

  private _awarenessUpdateHandler = (
    { added, updated, removed }: any,
    _origin: any,
  ) => {
    const changedClients = added.concat(updated).concat(removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients),
    );
    broadcastMessage(this, encoding.toUint8Array(encoder));
  };

  private _unloadHandler = () => {
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      [this.doc.clientID],
      "window unload",
    );
  };

  public onMessage(data: ArrayBuffer, origin: any) {
    if (this.connected) {
      this._bcSubscriber(data, origin);
    }
  }

  /**
   * @type {boolean}
   */
  get synced() {
    return this._synced;
  }

  set synced(state) {
    if (this._synced !== state) {
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  destroy() {
    this.disconnect();
    if (typeof window !== "undefined") {
      window.removeEventListener("unload", this._unloadHandler);
    } else if (typeof process !== "undefined") {
      process.off("exit", this._unloadHandler);
    }
    this.awareness.off("update", this._awarenessUpdateHandler);
    this.doc.off("update", this._updateHandler);
    super.destroy();
  }

  connect() {
    if (!this.connected) {
      // bc.subscribe(this.bcChannel, this._bcSubscriber);
      this.connected = true;
    }
    // send sync step1 to bc
    // write sync step 1
    const encoderSync = encoding.createEncoder();
    encoding.writeVarUint(encoderSync, messageSync);
    syncProtocol.writeSyncStep1(encoderSync, this.doc);
    this.send(encoding.toUint8Array(encoderSync), this);
    // broadcast local state
    const encoderState = encoding.createEncoder();
    encoding.writeVarUint(encoderState, messageSync);
    syncProtocol.writeSyncStep2(encoderState, this.doc);
    this.send(encoding.toUint8Array(encoderState), this);
    // write queryAwareness
    const encoderAwarenessQuery = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessQuery, messageQueryAwareness);
    this.send(encoding.toUint8Array(encoderAwarenessQuery), this);
    // broadcast local awareness state
    const encoderAwarenessState = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessState, messageAwareness);
    encoding.writeVarUint8Array(
      encoderAwarenessState,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
        this.doc.clientID,
      ]),
    );
    this.send(encoding.toUint8Array(encoderAwarenessState), this);
  }

  disconnect() {
    // broadcast message with local awareness state set to null (indicating disconnect)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        [this.doc.clientID],
        new Map(),
      ),
    );
    broadcastMessage(this, encoding.toUint8Array(encoder));
    if (this.connected) {
      // bc.unsubscribe(this.bcChannel, this._bcSubscriber);
      this.connected = false;
    }
  }
}
