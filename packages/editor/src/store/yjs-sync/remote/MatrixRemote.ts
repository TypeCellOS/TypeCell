import { createMatrixRoom, MatrixProvider } from "matrix-crdt";
import { createAtom, runInAction } from "mobx";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { MatrixClientPeg } from "../../../app/matrix-auth/MatrixClientPeg";
import { MatrixSessionStore } from "../../../app/matrix-auth/MatrixSessionStore";
import { getTestFlags } from "../../../config/config";
import { MatrixIdentifier } from "../../../identifiers/MatrixIdentifier";
import { getStoreService } from "../../local/stores";
import { Remote } from "./Remote";

export class MatrixRemote extends Remote {
  protected id: string = "matrix";
  // public doc: "loading" | "not-found" | Y.Doc = "loading";
  public matrixProvider: MatrixProvider | undefined;
  private _canWriteAtom = createAtom("_canWrite");
  private disposed = false;

  protected _awareness: Awareness | undefined;

  public get awareness(): Awareness | undefined {
    return this._awareness;
  }

  constructor(_ydoc: Y.Doc, private readonly identifier: MatrixIdentifier) {
    super(_ydoc);
    if (!(identifier instanceof MatrixIdentifier)) {
      throw new Error("invalid identifier");
    }
  }

  public get canWrite() {
    this._canWriteAtom.reportObserved();
    if (!this.matrixProvider) {
      return true;
    }
    return this.matrixProvider.canWrite;
  }

  public get canCreate() {
    return true;
  }

  public async create() {
    if (!getStoreService().sessionStore.loggedInUserId) {
      throw new Error("no user available on create document");
    }

    // TODO: check authority
    if (
      this.identifier.owner !== getStoreService().sessionStore.loggedInUserId
    ) {
      throw new Error("not authorized to create this document");
    }

    // // TODO (security): user2 can create a room @user1/doc
    const remoteResult = await createMatrixRoom(
      MatrixClientPeg.get(),
      this.identifier.roomName,
      "public-read"
    );
    if (remoteResult === "offline") {
      // TODO
      throw new Error("to be implemented");
    }
    if (remoteResult === "already-exists") {
      return "already-exists";
    }
    return remoteResult.status; // TODO
  }

  public async startSyncing() {
    if (this.disposed) {
      console.warn("already disposed");
      return;
    }
    const matrixSessionStore = getStoreService().sessionStore;
    if (!(matrixSessionStore instanceof MatrixSessionStore)) {
      throw new Error("invalid sessionStore (expected MatrixSessionStore)");
    }
    matrixSessionStore.enableGuest();
    const user = matrixSessionStore.user;
    if (typeof user === "string") {
      throw new Error("no user");
    }
    console.log("matrix listen");
    this._awareness = new Awareness(this._ydoc);

    this.matrixProvider = this._register(
      new MatrixProvider(
        this._ydoc,
        user.matrixClient, // TODO
        {
          type: "alias",
          alias:
            "#" +
            this.identifier.roomName +
            ":" +
            this.identifier.uri.authority,
        },
        getTestFlags().disableWebRTC ? undefined : this.awareness,
        {
          enableExperimentalWebrtcSync: !getTestFlags().disableWebRTC,
          translator: {
            updatesAsRegularMessages: false,
            updateEventType: "org.typecell.doc_update",
            snapshotEventType: "org.typecell.doc_snapshot",
          },
        }
      )
    );
    (this.matrixProvider as any).isRemote = true;
    this.matrixProvider.initialize();
    this._canWriteAtom.reportChanged();

    this._register(
      this.matrixProvider.onCanWriteChanged(() => {
        this._canWriteAtom.reportChanged();
      })
    );

    this._register(
      this.matrixProvider.onDocumentAvailable(() => {
        console.log("doc available");
        runInAction(() => {
          this.status = "loaded";
        });
      })
    );

    this._register(
      this.matrixProvider.onDocumentUnavailable(() => {
        runInAction(() => {
          this.status = "not-found";
        });
      })
    );

    this._register(this.matrixProvider);
    this._register({
      dispose: () => this.awareness?.destroy(),
    });
  }

  public dispose(): void {
    this.disposed = true;
    super.dispose();
  }
}

// SyncManager: holds a doc and responsible for loading / creating + syncing to local

// Remote, responsible for:
// caching sync / create / delete operations that were made offline
// - executing those when back online
// later: periodically updating docs from remote (e.g.: when user is offline)

/**
 * test:
 * - create doc alias "B" online
 * - create doc alias "A" online
 * - clear storage
 * - create doc alias "A" offline
 * - make "A" child of "B"
 * - Go online
 * - "A" should be renamed to "A-1"
 * - "A-1" should be child of "B"
 *
 */
