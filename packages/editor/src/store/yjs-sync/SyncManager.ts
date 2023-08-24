import {
  autorun,
  computed,
  makeObservable,
  observable,
  runInAction,
  when,
} from "mobx";
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

// import { MatrixRemote } from "./remote/MatrixRemote";
import { makeYDocObservable } from "@syncedstore/yjs-reactive-bindings";
import { SupabaseSessionStore } from "../../app/supabase-auth/SupabaseSessionStore";
import { SessionStore } from "../local/SessionStore";
import { Remote } from "./remote/Remote";
import { TypeCellRemote } from "./remote/TypeCellRemote";

type SyncingSyncManager = SyncManager & {
  state: {
    status: "syncing";
    localDoc: LocalDoc;
  };
};

export class SyncManager extends lifecycle.Disposable {
  private initializeCalled = false;
  private disposed = false;
  private readonly ydoc: Y.Doc;

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
        // TODO: fix / diagnose when this occurs
        console.warn(
          "should not be possible, doc status 'loading', but remote 'loaded'"
        );
        return "loading";
      }
      return remoteStatus;
    }
    return this.state.localDoc.ydoc;
  }

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
    makeYDocObservable(this.ydoc);
    makeObservable(this, {
      state: observable.ref,
      docOrStatus: computed,
    });

    this.remote = this.remoteForIdentifier(identifier);

    const disposeAutorun = autorun(() => {
      if (this.remote instanceof TypeCellRemote) {
        const unsyncedChanges = this.remote.unsyncedChanges;
        if (this.remote.status !== "loaded") {
          return; // don't update sync status if remote has not initialized sync yet
        }
        if (unsyncedChanges === 0) {
          if (!this.sessionStore.documentCoordinator) {
            throw new Error(
              "no documentCoordinator. logged out while syncing?"
            );
          }
          if (this.state.status === "loading") {
            throw new Error("not possible");
          }
          this.sessionStore.documentCoordinator.markSynced(this.state.localDoc);
        }
      }
    });

    this._register({
      dispose: () => {
        disposeAutorun();
      },
    });
    this._register({
      dispose: () => {
        this.ydoc.destroy();
      },
    });
    this._register(this.remote);
    this._register({
      dispose: () => (this.disposed = true),
    });
  }

  get canWrite(): boolean {
    if (
      this.remote instanceof FetchRemote &&
      this.state.status === "syncing" &&
      this.state.localDoc.meta.needs_save_since
    ) {
      // hacky fix for docs / httpidentifier
      return false;
    }
    return this.remote.canWrite;
  }

  private remoteForIdentifier(identifier: Identifier): Remote {
    if (identifier instanceof FileIdentifier) {
      throw new Error("not implemented anymore");
      // return new FilebridgeRemote(this.ydoc, identifier);
    } else if (identifier instanceof GithubIdentifier) {
      throw new Error("not implemented anymore");
      // return new GithubRemote(this.ydoc, identifier);
    } else if (identifier instanceof HttpsIdentifier) {
      return new FetchRemote(this.ydoc, identifier);
    } else if (identifier instanceof MatrixIdentifier) {
      throw new Error("not implemented anymore");
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
    if (!this.state.localDoc.meta.exists_at_remote) {
      await this.remote.createAndRetry();

      if (!this.sessionStore.documentCoordinator) {
        throw new Error("no documentCoordinator. logged out while syncing?");
      }
      this.sessionStore.documentCoordinator.markCreated(this.state.localDoc);
    }
    this.remote.startSyncing();
    // listen for events
  }

  private async loadFromRemote() {
    await this.remote.startSyncing();
    await when(() => this.remote.status === "loaded");

    if (!this.sessionStore.documentCoordinator) {
      throw new Error(
        "no documentCoordinator. logged out while loadFromRemote?"
      );
    }

    if (this.disposed) {
      return;
    }

    const localDoc =
      this.sessionStore.documentCoordinator.createDocumentFromRemote(
        this.identifier,
        this.ydoc
      );

    runInAction(() => {
      this.state = {
        status: "syncing",
        localDoc,
      };
    });

    // on sync add to store
    // listen for events
  }

  private async create(forkSource?: Y.Doc) {
    if (this.initializeCalled) {
      throw new Error("load() called when already initialized");
    }
    this.initializeCalled = true;

    if (!this.sessionStore.documentCoordinator) {
      throw new Error("no documentCoordinator. logged out while creating?");
    }

    if (forkSource) {
      Y.applyUpdateV2(this.ydoc, Y.encodeStateAsUpdateV2(forkSource));
    }

    const doc = await this.sessionStore.documentCoordinator.createDocument(
      this.identifier,
      this.ydoc
    );

    if (this.disposed) {
      return;
    }

    runInAction(() => {
      this.state = {
        status: "syncing",
        localDoc: doc,
      };
    });
    return this.startSyncing();
  }

  private async load() {
    if (this.initializeCalled) {
      throw new Error("load() called when already initialized");
    }
    this.initializeCalled = true;
    if (!this.sessionStore.documentCoordinator) {
      throw new Error("logged out while loading");
    }

    // hacky fix for docs / httpidentifier, so that if there are no changes we fetch the latest state from the server
    // (works with the rest of this workaround below)
    if (this.identifier instanceof HttpsIdentifier) {
      await this.sessionStore.documentCoordinator.clearIfNotChanged(
        this.identifier
      );
    }

    const doc = this.sessionStore.documentCoordinator.loadDocument(
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

      runInAction(() => {
        this.state = {
          status: "syncing",
          localDoc: doc,
        };
      });

      // hacky fix for docs / httpidentifier, if we have a local copy of an https document, we don't want to sync
      // (because FetchRemote would return a new document that's different / unsyncable with the local copy)
      if (!(this.identifier instanceof HttpsIdentifier)) {
        return this.startSyncing();
      }
    }
  }

  public async clearAndReload() {
    if (this.disposed) {
      throw new Error("clearAndReload: already disposed");
    }

    if (!this.sessionStore.documentCoordinator) {
      throw new Error("logged out while clearAndReload");
    }
    await this.sessionStore.documentCoordinator.deleteLocal(this.identifier);
    this.dispose();

    return SyncManager.load(this.identifier, this.sessionStore);
  }

  public dispose() {
    console.log("SyncManager dispose", this.identifier.toString());
    setTimeout(() => {
      this.ydoc.destroy();
    }, 0);

    this.disposed = true;
    super.dispose();
  }

  public async waitTillLoaded() {
    await when(() => this.state.status === "syncing");
    return this as SyncingSyncManager;
  }

  public static create(
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

    manager.create(forkSource).catch((e) => {
      console.error("error in SyncManager.create", e);
    });

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

    console.log("SyncManager load", identifier.toString());
    const manager = new SyncManager(identifier, sessionStore);
    manager.load().catch((e) => {
      console.error("error in SyncManager.load", e);
    });
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
