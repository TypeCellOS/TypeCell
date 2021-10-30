import { MatrixClient } from "matrix-js-sdk";
import { event, lifecycle } from "vscode-lib";
import { isSnapshotEvent, isUpdateEvent } from "./matrixUtil";

const PEEK_POLL_TIMEOUT = 30 * 1000;
const PEEK_POLL_ERROR_TIMEOUT = 30 * 1000;
const SNAPSHOT_INTERVAL = 30; // snapshot after 30 events

export class MatrixReader extends lifecycle.Disposable {
  public latestToken: string | undefined;
  private disposed = false;
  private polling = false;
  private pendingPollRequest: any;
  private pollRetryTimeout: ReturnType<typeof setTimeout> | undefined;
  private messagesSinceSnapshot = 0;

  private readonly _onEvents = this._register(
    new event.Emitter<{ events: any[]; shouldSendSnapshot: boolean }>()
  );
  public readonly onEvents: event.Event<{
    events: any[];
    shouldSendSnapshot: boolean;
  }> = this._onEvents.event;

  public constructor(
    private matrixClient: MatrixClient,
    public readonly roomId: string
  ) {
    super();
    // TODO: catch events for when room has been deleted or user has been kicked
    this.matrixClient.on("Room.timeline", this.matrixRoomListener);
  }

  /**
   * Only receives messages from rooms the user has joined, and after startClient() has been called
   * (i.e.: they're received via the sync API).
   *
   * At this moment, we only poll for events using the /events endpoint.
   * I.e. the Sync API should not be used (and startClient() should not be called).
   *
   * We do this because we don't want the MatrixClient to keep all events in memory.
   * For yjs, this is not necessary, as events are document updates which are accumulated in the yjs
   * document, so already stored there.
   *
   * In a later version, it might be more efficient to call the /sync API manually
   * (without relying on the Timeline / sync system in the matrix-js-sdk),
   * because it allows us to retrieve events for multiple rooms simultaneously, instead of
   * a seperate /events poll per room
   */
  private matrixRoomListener = (
    event: any,
    room: any,
    toStartOfTimeline: boolean
  ) => {
    console.error("not expected; ");
    throw new Error(
      "unexpected, we don't use /sync calls for MatrixReader, startClient should not be used on the Matrix client"
    );
  };

  // TODO validate order is [old...new]
  private processEvents(events: any[]) {
    let shouldSendSnapshot = false;
    for (let event of events) {
      if (isUpdateEvent(event)) {
        if (event.room_id !== this.roomId) {
          throw new Error("event received with invalid roomid");
        }
        this.messagesSinceSnapshot++;
        if (
          this.messagesSinceSnapshot % SNAPSHOT_INTERVAL === 0 &&
          event.user_id === this.matrixClient.credentials.userId
        ) {
          // We don't want multiple users send a snapshot at the same time,
          // to prevent this, we have a simple (probably not fool-proof) "snapshot user election"
          // system which says that the user who sent a message SNAPSHOT_INTERVAL events since
          // the last snapshot is responsible for posting a new snapshot.

          // In case a user fails to do so,
          // we use % to make sure we retry this on the next SNAPSHOT_INTERVAL
          shouldSendSnapshot = true;
        }
      } else if (isSnapshotEvent(event)) {
        this.messagesSinceSnapshot = 0;
        shouldSendSnapshot = false;
      }
    }
    return shouldSendSnapshot;
  }

  private async peekPoll() {
    if (!this.latestToken) {
      throw new Error("polling but no pagination token");
    }
    if (this.disposed) {
      return;
    }
    try {
      this.pendingPollRequest = this.matrixClient.http.authedRequest(
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

      const shouldSendSnapshot = this.processEvents(results.chunk);

      if (results.chunk.length) {
        this._onEvents.fire({ events: results.chunk, shouldSendSnapshot });
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

  public async getInitialDocumentUpdateEvents() {
    let ret: any[] = [];
    let token = "";
    let hasNextPage = true;
    let lastEventInSnapshot: string | undefined;
    while (hasNextPage) {
      const res = await this.matrixClient.createMessagesRequest(
        this.roomId,
        token,
        30,
        "b"
        // TODO: filter?
      );

      for (let event of res.chunk) {
        if (isSnapshotEvent(event)) {
          ret.push(event);
          lastEventInSnapshot = event.content.last_event_id;
        } else if (isUpdateEvent(event)) {
          if (lastEventInSnapshot && lastEventInSnapshot === event.event_id) {
            if (!this.latestToken) {
              this.latestToken = res.start;
            }
            return ret.reverse();
          }
          this.messagesSinceSnapshot++;
          ret.push(event);
        }
      }

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

  public get isStarted() {
    return this.polling;
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
