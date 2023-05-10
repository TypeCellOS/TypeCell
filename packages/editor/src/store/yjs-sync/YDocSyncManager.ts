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
import { DocumentCoordinator, LocalDoc } from "./DocumentCoordinator";
import FetchRemote from "./remote/FetchRemote";
import { FilebridgeRemote } from "./remote/FilebridgeRemote";
import GithubRemote from "./remote/GithubRemote";
import { MatrixRemote } from "./remote/MatrixRemote";
import { Remote } from "./remote/Remote";
import { TypeCellRemote } from "./remote/TypeCellRemote";

const coordinator = new DocumentCoordinator("test");
export class YDocSyncManager2 extends lifecycle.Disposable {
  // private _ydoc: Y.Doc;
  private initializeCalled = false;
  private disposed = false;

  public doc:
    | {
        status: "loading";
        ydoc: Y.Doc;
      }
    | {
        status: "syncing";
        localDoc: LocalDoc;
      };

  public get docOrStatus() {
    const remoteStatus = this.remote.status;
    if (this.doc.status === "loading") {
      if (remoteStatus === "loaded") {
        // throw new Error("not possible"); // TODO: is this safe?
        console.error(
          "should not be possible, doc status 'loading', but remote 'loaded'"
        );
        return "loading";
      }
      return remoteStatus;
    }
    return this.doc.localDoc.ydoc;
  }

  private get ydoc() {
    if (this.doc.status === "syncing") {
      return this.doc.localDoc.ydoc;
    } else {
      return this.doc.ydoc;
    }
  }
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
    private readonly localDoc: LocalDoc | undefined
  ) {
    super();
    if (localDoc) {
      this.doc = {
        status: "syncing",
        localDoc: localDoc,
      };
    } else {
      this.doc = {
        status: "loading",
        ydoc: new Y.Doc({ guid: this.identifier.toString() }),
      };
    }

    makeObservable(this, {
      doc: observable.ref,
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
      return new MatrixRemote(this.ydoc, identifier);
    } else if (identifier instanceof TypeCellIdentifier) {
      return new TypeCellRemote(this.ydoc, identifier);
    } else {
      throw new Error("unsupported identifier");
    }
  }

  public async createAndSync() {
    await this.remote.createAndRetry();
    // Set as created

    this.remote.startSyncing();
    // listen for events
  }

  public async startSyncing() {
    this.remote.startSyncing();
    // listen for events
  }

  public async loadFromRemote() {
    await this.remote.startSyncing();
    when(
      () => this.remote.status === "loaded",
      () => {
        const localDoc = coordinator.createDocumentFromRemote(
          this.identifier,
          this.ydoc
        );

        runInAction(() => {
          this.doc = {
            status: "syncing",
            localDoc,
          };
        });
      }
    );

    // on sync add to store
    // listen for events
  }

  public async clearAndReload() {
    await coordinator.deleteLocal(this.identifier);
    this.dispose();

    return YDocSyncManager2.load(this.identifier);
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
    this.disposed = true;
    super.dispose();
  }

  public static async create(identifier: Identifier, forkSource?: Y.Doc) {
    // create locally
    // start syncing:
    //  - periodically "create" when not created
    //  - sync when created, update values in coordinator

    const doc = await coordinator.createDocument(identifier);

    const manager = new YDocSyncManager2(identifier, doc);

    if (forkSource) {
      Y.applyUpdateV2(doc.ydoc, Y.encodeStateAsUpdateV2(forkSource)); // TODO
    }

    manager.createAndSync();
    return manager;
  }

  public static load(identifier: Identifier) {
    // IF not existing
    // - load from remote
    // - create locally
    // - start syncing, update values in coordinator

    // IF existing
    //  - load from coordinator
    //  - start syncing, update values in coordinator

    const doc = coordinator.loadDocument(identifier);

    let manager: YDocSyncManager2;
    if (doc === "not-found") {
      manager = new YDocSyncManager2(identifier, undefined);
      manager.loadFromRemote();
    } else {
      manager = new YDocSyncManager2(identifier, doc);
      manager.startSyncing();
    }

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
