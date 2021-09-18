import { MatrixClient } from "matrix-js-sdk";
import { event, lifecycle } from "vscode-lib";

const PEEK_POLL_TIMEOUT = 30 * 1000;
const PEEK_POLL_ERROR_TIMEOUT = 30 * 1000;

export class MatrixReader extends lifecycle.Disposable {
  public latestToken: string | undefined;
  private disposed = false;
  private polling = false;
  private pendingPollRequest: any;
  private pollRetryTimeout: ReturnType<typeof setTimeout> | undefined;

  private readonly _onMessages: event.Emitter<any[]> = this._register(
    new event.Emitter<any[]>()
  );
  public readonly onMessages: event.Event<any[]> = this._onMessages.event;

  public constructor(
    private matrixClient: MatrixClient,
    private roomId: string
  ) {
    super();
    // TODO: catch events for when room has been deleted or user has been kicked
    this.matrixClient.on("Room.timeline", this.matrixRoomListener);
  }

  /**
   * Only receives messages from rooms the user has joined, and after startClient() has been called
   * (i.e.: they're received via the sync API).
   *
   * TODO: Maybe we can disable support for this and only use the peek API
   */
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
    // TODO: doesn't set latesttoken
    this._onMessages.fire([event]);
  };

  private async peekPoll() {
    if (!this.latestToken) {
      throw new Error("polling but no pagination token");
    }
    if (this.disposed) {
      return;
    }
    try {
      this.pendingPollRequest = this.matrixClient._http.authedRequest(
        undefined,
        "GET",
        "/events",
        {
          room_id: this.roomId,
          timeout: PEEK_POLL_TIMEOUT,
          from: this.latestToken,
        },
        undefined,
        PEEK_POLL_TIMEOUT * 2
      );
      const results = await this.pendingPollRequest;
      this.pendingPollRequest = undefined;
      if (this.disposed) {
        return;
      }

      const messages = this.getMessagesFromResults(results);
      if (messages.length) {
        this._onMessages.fire(messages);
      }

      this.latestToken = results.end;
      this.peekPoll();
    } catch (e) {
      console.error("peek error", e);
      if (!this.disposed) {
        this.pollRetryTimeout = setTimeout(
          () => this.peekPoll(),
          PEEK_POLL_ERROR_TIMEOUT
        );
      }
    }
  }

  private getMessagesFromResults(res: any) {
    const ret: any[] = [];
    const events = res.chunk;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.type !== "m.room.message") {
        continue;
      }
      if (event.room_id !== this.roomId) {
        continue;
      }
      if (!event.content?.body) {
        continue; // redacted / deleted?
      }
      // if (event.event_id === sinceEventId) {
      //   return ret;
      // }
      ret.push(event);
    }
    return ret;
  }

  public async getAllInitialEvents() {
    let ret: any[] = [];
    let token = "";

    let hasNextPage = true;
    while (hasNextPage) {
      const res = await this.matrixClient.createMessagesRequest(
        this.roomId,
        token,
        30,
        "b"
      );
      // res.end !== res.start
      ret.push.apply(ret, this.getMessagesFromResults(res));
      token = res.end;
      if (!this.latestToken) {
        this.latestToken = res.start;
      }
      hasNextPage = res.start !== res.end;
    }
    return ret.reverse();
  }

  public startPolling() {
    if (this.polling) {
      throw new Error("already polling");
    }
    this.polling = true;
    this.peekPoll();
  }

  public dispose() {
    this.disposed = true;
    super.dispose();
    if (this.pollRetryTimeout) {
      clearTimeout(this.pollRetryTimeout);
    }
    if (this.pendingPollRequest) {
      this.pendingPollRequest.abort();
    }
    this.matrixClient.off("Room.timeline", this.matrixRoomListener);
  }
}
