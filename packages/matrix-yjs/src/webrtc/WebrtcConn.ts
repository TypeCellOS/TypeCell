import * as encoding from "lib0/encoding";
import * as logging from "lib0/logging";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import { announceSignalingInfo } from "./globalResources";
import { messageSync, messageAwareness } from "./messageConstants";
import { Room } from "./Room";
import Peer from "simple-peer";

const log = logging.createModuleLogger("y-webrtc");

export class WebrtcConn {
  private closed = false;
  private connected = false;
  public synced = false;

  private sendWebrtcConn(encoder: encoding.Encoder) {
    log(
      "send message to ",
      logging.BOLD,
      this.remotePeerId,
      logging.UNBOLD,
      logging.GREY,
      " (",
      this.room.name,
      ")",
      logging.UNCOLOR
    );
    try {
      this.peer.send(encoding.toUint8Array(encoder));
    } catch (e) {}
  }

  private readPeerMessage(buf: Uint8Array) {
    const room = this.room;
    log(
      "received message from ",
      logging.BOLD,
      this.remotePeerId,
      logging.GREY,
      " (",
      room.name,
      ")",
      logging.UNBOLD,
      logging.UNCOLOR
    );
    return room.readMessage(buf, () => {
      this.synced = true;
      log(
        "synced ",
        logging.BOLD,
        room.name,
        logging.UNBOLD,
        " with ",
        logging.BOLD,
        this.remotePeerId
      );
      room.checkIsSynced();
    });
  }
  public readonly peer: Peer.Instance;
  /**
   * @param {SignalingConn} signalingConn
   * @param {boolean} initiator
   * @param {string} remotePeerId
   * @param {Room} room
   */
  constructor(
    signalingConn: any,
    initiator: boolean,
    private readonly remotePeerId: string,
    private readonly room: Room
  ) {
    log("establishing connection to ", logging.BOLD, remotePeerId);
    /**
     * @type {any}
     */
    this.peer = new Peer({ initiator, ...room.provider.peerOpts });
    this.peer.on("signal", (signal: any) => {
      signalingConn.publishSignalingMessage(room, {
        to: remotePeerId,
        from: room.peerId,
        type: "signal",
        signal,
      });
    });
    this.peer.on("connect", () => {
      log("connected to ", logging.BOLD, remotePeerId);
      this.connected = true;
      // send sync step 1
      const provider = room.provider;
      const doc = provider.doc;
      const awareness = room.awareness;
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, doc);
      this.sendWebrtcConn(encoder);
      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            awareness,
            Array.from(awarenessStates.keys())
          )
        );
        this.sendWebrtcConn(encoder);
      }
    });
    this.peer.on("close", () => {
      this.connected = false;
      this.closed = true;
      if (room.webrtcConns.has(this.remotePeerId)) {
        room.webrtcConns.delete(this.remotePeerId);
        room.provider.emit("peers", [
          {
            removed: [this.remotePeerId],
            added: [],
            webrtcPeers: Array.from(room.webrtcConns.keys()),
            bcPeers: Array.from(room.bcConns),
          },
        ]);
      }
      room.checkIsSynced();
      this.peer.destroy();
      log("closed connection to ", logging.BOLD, remotePeerId);
      announceSignalingInfo(room);
    });
    this.peer.on("error", (err: any) => {
      log("Error in connection to ", logging.BOLD, remotePeerId, ": ", err);
      announceSignalingInfo(room);
    });
    this.peer.on("data", (data: Uint8Array) => {
      const answer = this.readPeerMessage(data);
      if (answer !== null) {
        this.sendWebrtcConn(answer);
      }
    });
  }

  destroy() {
    this.peer.destroy();
  }
}
