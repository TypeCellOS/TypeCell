import * as error from "lib0/error";
import * as logging from "lib0/logging";
import * as map from "lib0/map";
import * as math from "lib0/math";
import { Observable } from "lib0/observable";
import * as random from "lib0/random";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs"; // eslint-disable-line
import * as cryptoutils from "./crypto.js";
import { globalRooms, globalSignalingConns } from "./globalResources.js";
import { Room } from "./Room.js";
import { SignalingConn } from "./SignalingConn.js";

const log = logging.createModuleLogger("y-webrtc");

const openRoom = (
  doc: Y.Doc,
  provider: WebrtcProvider,
  name: string,
  key: CryptoKey | undefined
) => {
  // there must only be one room
  if (globalRooms.has(name)) {
    throw error.create(`A Yjs Doc connected to room "${name}" already exists!`);
  }
  const room = new Room(doc, provider, name, key);
  globalRooms.set(name, room);
  return room;
};

export class WebrtcProvider extends Observable<string> {
  public readonly awareness: awarenessProtocol.Awareness;
  private shouldConnect = false;
  public readonly filterBcConns: boolean = true;
  private readonly signalingUrls: string[];
  private readonly signalingConns: SignalingConn[];
  public readonly peerOpts: any;
  public readonly maxConns: number;
  private readonly key: Promise<CryptoKey | undefined>;
  private room: Room | undefined;

  constructor(
    private readonly roomName: string,
    public readonly doc: Y.Doc,
    {
      signaling = [
        "wss://signaling.yjs.dev",
        "wss://y-webrtc-signaling-eu.herokuapp.com",
        "wss://y-webrtc-signaling-us.herokuapp.com",
      ],
      password = undefined as undefined | string,
      awareness = new awarenessProtocol.Awareness(doc),
      maxConns = 20 + math.floor(random.rand() * 15), // the random factor reduces the chance that n clients form a cluster
      filterBcConns = true,
      peerOpts = {}, // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts
    } = {}
  ) {
    super();
    this.filterBcConns = filterBcConns;
    this.awareness = awareness;
    this.shouldConnect = false;
    this.signalingUrls = signaling;
    this.signalingConns = [];
    this.maxConns = maxConns;
    this.peerOpts = peerOpts;
    this.key = password
      ? cryptoutils.deriveKey(password, roomName)
      : Promise.resolve(undefined);

    this.key.then((key) => {
      this.room = openRoom(doc, this, roomName, key);
      if (this.shouldConnect) {
        this.room.connect();
      } else {
        this.room.disconnect();
      }
    });
    this.connect();
    this.destroy = this.destroy.bind(this);
    doc.on("destroy", this.destroy);

    window.addEventListener("beforeunload", () => {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [doc.clientID],
        "window unload"
      );
      globalRooms.forEach((room) => {
        room.disconnect();
      });
    });
  }

  /**
   * @type {boolean}
   */
  get connected() {
    return this.room !== null && this.shouldConnect;
  }

  connect() {
    this.shouldConnect = true;
    this.signalingUrls.forEach((url) => {
      const signalingConn = map.setIfUndefined(
        globalSignalingConns,
        url,
        () => new SignalingConn(url)
      );
      this.signalingConns.push(signalingConn);
      signalingConn.providers.add(this);
    });
    if (this.room) {
      this.room.connect();
    }
  }

  disconnect() {
    this.shouldConnect = false;
    this.signalingConns.forEach((conn) => {
      conn.providers.delete(this);
      if (conn.providers.size === 0) {
        conn.destroy();
        globalSignalingConns.delete(conn.url);
      }
    });
    if (this.room) {
      this.room.disconnect();
    }
  }

  destroy() {
    this.doc.off("destroy", this.destroy);
    // need to wait for key before deleting room
    this.key.then(() => {
      this.room?.destroy();
      globalRooms.delete(this.roomName);
    });
    super.destroy();
  }
}
