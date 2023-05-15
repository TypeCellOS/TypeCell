import { computed, makeObservable, observable, runInAction, when } from "mobx";
import { lifecycle } from "vscode-lib";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { FileIdentifier } from "../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../identifiers/HttpsIdentifier";
import { Identifier } from "../../identifiers/Identifier";
import { MatrixIdentifier } from "../../identifiers/MatrixIdentifier";
import { TypeCellIdentifier } from "../../identifiers/TypeCellIdentifier";
import { LocalDoc } from "./DocumentCoordinator";
import FetchRemote from "./remote/FetchRemote";
import { FilebridgeRemote } from "./remote/FilebridgeRemote";
import GithubRemote from "./remote/GithubRemote";
// import { MatrixRemote } from "./remote/MatrixRemote";
import { SupabaseSessionStore } from "../../app/supabase-auth/SupabaseSessionStore";
import { SessionStore } from "../local/SessionStore";
import { Remote } from "./remote/Remote";
import { TypeCellRemote } from "./remote/TypeCellRemote";

export class SyncManager extends lifecycle.Disposable {
  // private _ydoc: Y.Doc;
  private initializeCalled = false;
  private disposed = false;

  public state:
    | { status: "loading" }
    | {
        status: "syncing";
        localDoc: LocalDoc;
      } = { status: "loading" };

  public get docOrStatus() {
    const remoteStatus = this.remote.status;
    if (this.state.status === "loading") {
      if (remoteStatus === "loaded") {
        // throw new Error("not possible"); // TODO: is this safe?
        console.error(
          "should not be possible, doc status 'loading', but remote 'loaded'"
        );
        return "loading";
      }
      return remoteStatus;
    }
    return this.state.localDoc.ydoc;
  }

  private readonly ydoc: Y.Doc;

  /**
   * Get the managed "doc". Returns:
   * - a Y.Doc encapsulating the loaded doc if available
   * - "not-found" if the document doesn't exist locally / remote
   * - "loading" if we're still loading the document
   *
   * (mobx observable)
   */
  // public doc: "loading" | "not-found" | Y.Doc = "loading";

  public get awareness() {
    return this.remote.awareness;
  }

  /** @internal */
  public indexedDBProvider: IndexeddbPersistence | undefined;
  public readonly remote: Remote;
  constructor(
    public readonly identifier: Identifier,
    // private readonly localDoc: LocalDoc | undefined,
    private readonly sessionStore: SessionStore
  ) {
    super();
    // if (localDoc) {
    //   this.doc = {
    //     status: "syncing",
    //     localDoc: localDoc,
    //   };
    // } else {
    //   this.doc = {
    //     status: "loading",
    //     ydoc: new Y.Doc({ guid: this.identifier.toString() }),
    //   };
    // }

    this.ydoc = new Y.Doc({ guid: this.identifier.toString() });

    makeObservable(this, {
      state: observable.ref,
      docOrStatus: computed,
    });

    // this._ydoc = new Y.Doc({ guid: this.identifier.toString() });

    this.remote = this.remoteForIdentifier(identifier);

    // TODO
    // this._register({
    //   dispose: () => {
    //     this._ydoc.destroy();
    //   },
    // });
    this._register(this.remote);
    this._register({
      dispose: () => (this.disposed = true),
    });
  }

  get canWrite(): boolean {
    return this.remote.canWrite;
  }

  private remoteForIdentifier(identifier: Identifier): Remote {
    if (identifier instanceof FileIdentifier) {
      return new FilebridgeRemote(this.ydoc, identifier);
    } else if (identifier instanceof GithubIdentifier) {
      return new GithubRemote(this.ydoc, identifier);
    } else if (identifier instanceof HttpsIdentifier) {
      return new FetchRemote(this.ydoc, identifier);
    } else if (identifier instanceof MatrixIdentifier) {
      throw new Error("nope");
      // return new MatrixRemote(this.ydoc, identifier);
    } else if (identifier instanceof TypeCellIdentifier) {
      if (!(this.sessionStore instanceof SupabaseSessionStore)) {
        // TODO: should this be possible?
        throw new Error(
          "can't load from supabase without supabasesessionstore"
        );
      }
      return new TypeCellRemote(this.ydoc, identifier, this.sessionStore);
    } else {
      throw new Error("unsupported identifier");
    }
  }

  public async startSyncing() {
    if (this.state.status !== "syncing") {
      throw new Error("not syncing");
    }
    if (this.state.localDoc.meta.last_synced_at === null) {
      await this.remote.createAndRetry();

      if (typeof this.sessionStore.user === "string") {
        throw new Error("logged out while syncing");
      }
      this.sessionStore.user.coordinator.markSynced(this.state.localDoc);
    }
    this.remote.startSyncing();
    // listen for events
  }

  private async loadFromRemote() {
    await this.remote.startSyncing();
    await when(() => this.remote.status === "loaded");

    if (typeof this.sessionStore.user === "string") {
      throw new Error("logged out while loading");
    }

    if (this.disposed) {
      return;
    }

    const localDoc =
      this.sessionStore.user.coordinator.createDocumentFromRemote(
        this.identifier,
        this.ydoc
      );

    if (localDoc.meta.last_synced_at === null) {
      // TODO
      // throw new Error("not possible");
    }

    runInAction(() => {
      this.state = {
        status: "syncing",
        localDoc,
      };
    });

    // on sync add to store
    // listen for events
  }

  public async create(forkSource?: Y.Doc) {
    if (this.initializeCalled) {
      throw new Error("load() called when already initialized");
    }
    this.initializeCalled = true;

    if (typeof this.sessionStore.user === "string") {
      throw new Error("logged out while creating");
    }

    const doc = await this.sessionStore.user.coordinator.createDocument(
      this.identifier,
      this.ydoc
    );

    if (forkSource) {
      Y.applyUpdateV2(doc.ydoc, Y.encodeStateAsUpdateV2(forkSource)); // TODO
    }

    runInAction(() => {
      this.state = {
        status: "syncing",
        localDoc: doc,
      };
    });
    return this.startSyncing();
  }

  public async load() {
    if (this.initializeCalled) {
      throw new Error("load() called when already initialized");
    }
    this.initializeCalled = true;
    if (typeof this.sessionStore.user === "string") {
      throw new Error("logged out while loading");
    }
    const doc = this.sessionStore.user.coordinator.loadDocument(
      this.identifier,
      this.ydoc
    );

    if (doc === "not-found") {
      // the document did not exist locally
      return this.loadFromRemote();
    } else {
      // the document was previously loaded (and exists in the local cache)

      // TODO: catch when doc didn't exist locally

      await doc.idbProvider.whenSynced;
      console.log("done synced", doc.ydoc.toJSON());
      runInAction(() => {
        this.state = {
          status: "syncing",
          localDoc: doc,
        };
      });
      return this.startSyncing();
    }
  }

  public async clearAndReload() {
    if (typeof this.sessionStore.user === "string") {
      throw new Error("logged out while clearAndReload");
    }
    await this.sessionStore.user.coordinator.deleteLocal(this.identifier);
    this.dispose();

    return SyncManager.load(this.identifier, this.sessionStore);
  }

  public async fork() {
    throw new Error("not implemented");
  }
  //   if (!getStoreService().sessionStore.loggedInUserId) {
  //     throw new Error("not logged in");
  //   }

  //   let tryN = 1;

  //   do {
  //     // TODO
  //     if (!(this.identifier instanceof MatrixIdentifier)) {
  //       throw new Error("not implemented");
  //     }
  //     // TODO: test
  //     const newIdentifier = new MatrixIdentifier(
  //       uri.URI.from({
  //         scheme: this.identifier.uri.scheme,
  //         // TODO: use user authority,
  //         path:
  //           getStoreService().sessionStore.loggedInUserId +
  //           "/" +
  //           this.identifier.document +
  //           (tryN > 1 ? "-" + tryN : ""),
  //       })
  //     );

  //     const manager = await YDocSyncManager2.create(newIdentifier, this._ydoc);

  //     if (manager !== "already-exists") {
  //       await this.clearAndReload();
  //       return manager;
  //     }
  //     tryN++;
  //   } while (true);
  // }

  public dispose() {
    console.log("SyncManager dispose", this.identifier.toString());
    this.ydoc.destroy();
    this.disposed = true;
    super.dispose();
  }

  public static async create(
    identifier: Identifier,
    sessionStore: SessionStore,
    forkSource?: Y.Doc
  ) {
    // create locally
    // start syncing:
    //  - periodically "create" when not created
    //  - sync when created, update values in coordinator

    console.log("SyncManager create", identifier.toString());

    const manager = new SyncManager(identifier, sessionStore);

    manager.create(forkSource);

    return manager;
  }

  public static load(identifier: Identifier, sessionStore: SessionStore) {
    // IF not existing
    // - load from remote
    // - create locally
    // - start syncing, update values in coordinator

    // IF existing
    //  - load from coordinator
    //  - start syncing, update values in coordinator

    // const doc = coordinator.loadDocument(identifier);

    // let manager: SyncManager;
    // if (doc === "not-found") {
    //   manager = new SyncManager(identifier, undefined, sessionStore);
    //   manager.loadFromRemote();
    // } else {
    //   manager = new SyncManager(identifier, doc, sessionStore);
    //   manager.startSyncing();
    // }

    console.log("SyncManager load", identifier.toString());
    let manager = new SyncManager(identifier, sessionStore);
    manager.load();
    // TODO: don't return synced when idb is still loading

    return manager;
  }
}

/*

DocConnection: manages cache of documents by identifier
SyncManager: manages syncing of a single document with localcache and remote
Remote: manages syncing with a single remote

Create:
- DocConnection.create(identifier)
- SyncManager.create(identifier) 
  -> creates locally
  -> creates remote
- Remote.canCreate, Remote.create(identifier)

Load:
- DocConnection.load(identifier)



- status of syncing (last sync time)
- delete / create offline
- make changes offline and sync later
- fork
- guest copy
- ids and aliases
- login / logout



- User loads @user/document
- Maps to mx://mx.typecell.org/@user/document
- Loads from indexeddb
- Starts syncing with mx://mx.typecell.org/@user/document

*/
