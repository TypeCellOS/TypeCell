import { makeObservable, observable, runInAction, when } from "mobx";
import { lifecycle, uri } from "vscode-lib";
import { IndexeddbPersistence } from "y-indexeddb";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { FileIdentifier } from "../../../identifiers/FileIdentifier";
import { GithubIdentifier } from "../../../identifiers/GithubIdentifier";
import { HttpsIdentifier } from "../../../identifiers/HttpsIdentifier";
import { Identifier } from "../../../identifiers/Identifier";
import { MatrixIdentifier } from "../../../identifiers/MatrixIdentifier";
import { getStoreService } from "../../local/stores";
import {
  existsLocally,
  getIDBIdentifier,
  waitForIDBSynced,
} from "../IDBHelper";
import { SyncManager } from "../SyncManager";
import FetchRemote from "./remote/FetchRemote";
import { FilebridgeRemote } from "./remote/FilebridgeRemote";
import GithubRemote from "./remote/GithubRemote";
import { MatrixRemote } from "./remote/MatrixRemote";
import { Remote } from "./remote/Remote";

export class YDocSyncManager2
  extends lifecycle.Disposable
  implements SyncManager
{
  private _ydoc: Y.Doc;
  private initializeCalled = false;
  private disposed = false;
  /**
   * Get the managed "doc". Returns:
   * - a Y.Doc encapsulating the loaded doc if available
   * - "not-found" if the document doesn't exist locally / remote
   * - "loading" if we're still loading the document
   *
   * (mobx observable)
   *
   * @type {("loading" | "not-found" | Y.Doc)}
   * @memberof DocConnection
   */
  public doc: "loading" | "not-found" | Y.Doc = "loading";
  public readonly idbIdentifier: string;
  public awareness: awarenessProtocol.Awareness; // TODO: make observable?, public get

  /** @internal */
  public indexedDBProvider: IndexeddbPersistence | undefined;
  public readonly remote: Remote;
  constructor(public readonly identifier: Identifier) {
    super();
    makeObservable(this, {
      doc: observable.ref,
    });

    this.idbIdentifier = getIDBIdentifier(
      this.identifier.toString(),
      getStoreService().sessionStore.loggedInUserId
    );

    this._ydoc = new Y.Doc({ guid: this.identifier.toString() });
    this.awareness = new awarenessProtocol.Awareness(this._ydoc);

    this.remote = this.remoteForIdentifier(identifier);

    this._register({
      dispose: () => {
        this.awareness.destroy();
        this._ydoc.destroy();
      },
    });
    this._register(this.remote);
  }
  get canWrite(): boolean {
    return this.remote.canWrite;
  }

  private async initializeLocal() {
    if (this.disposed) {
      console.warn("already disposed");
      return;
    }

    this.indexedDBProvider = new IndexeddbPersistence(
      this.idbIdentifier,
      this._ydoc
    );
    this._register({ dispose: () => this.indexedDBProvider?.destroy() });

    await waitForIDBSynced(this.indexedDBProvider);

    runInAction(() => {
      this.doc = this._ydoc;
    });
  }

  public async initialize() {
    try {
      if (this.initializeCalled) {
        throw new Error("already called initialize() on YDocSyncManager");
      }
      this.initializeCalled = true;
      await this.initializeNoCatch();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async initializeNoCatch() {
    if (typeof this.doc !== "string") {
      throw new Error("already loaded");
    }

    const alreadyLocal = await existsLocally(this.idbIdentifier);

    if (alreadyLocal) {
      await this.initializeLocal();
    }

    await this.remote.load();

    if (this.disposed) {
      console.warn("already disposed");
      return;
    }

    if (!alreadyLocal) {
      const dispose = when(
        () => this.remote.status === "loaded",
        () => {
          if (this.indexedDBProvider) {
            throw new Error("unexpected, suddenly has indexedDBProvider");
          }
          this.initializeLocal();
        }
      );

      this._register({
        dispose,
      });
    }
  }

  private remoteForIdentifier(identifier: Identifier): Remote {
    if (identifier instanceof FileIdentifier) {
      return new FilebridgeRemote(this._ydoc, this.awareness, identifier);
    } else if (identifier instanceof GithubIdentifier) {
      return new GithubRemote(this._ydoc, this.awareness, identifier);
    } else if (identifier instanceof HttpsIdentifier) {
      return new FetchRemote(this._ydoc, this.awareness, identifier);
    } else if (identifier instanceof MatrixIdentifier) {
      return new MatrixRemote(this._ydoc, this.awareness, identifier);
    } else {
      throw new Error("unsupported identifier");
    }
  }

  public async create(forkSource?: Y.Doc) {
    if (
      await existsLocally(
        getIDBIdentifier(
          this.identifier.toString(),
          getStoreService().sessionStore.loggedInUserId
        )
      )
    ) {
      return "already-exists";
    }

    if (!this.remote.canCreate) {
      throw new Error("remote doesn't support creation");
    }
    // TODO: local first create
    const ret = await this.remote.create();
    if (ret !== "ok") {
      return ret;
    }

    if (forkSource) {
      Y.applyUpdateV2(this._ydoc, Y.encodeStateAsUpdateV2(forkSource));
    }
    return ret;
  }

  public async clearAndReload() {
    if (!this.indexedDBProvider) {
      throw new Error("deleteLocalChanges() called without indexedDBProvider");
    }
    await this.indexedDBProvider.clearData();
    this.dispose();

    return YDocSyncManager2.load(this.identifier);
  }

  public async fork() {
    if (!getStoreService().sessionStore.loggedInUserId) {
      throw new Error("not logged in");
    }

    let tryN = 1;

    do {
      // TODO
      if (!(this.identifier instanceof MatrixIdentifier)) {
        throw new Error("not implemented");
      }
      // TODO: test
      const newIdentifier = new MatrixIdentifier(
        uri.URI.from({
          scheme: this.identifier.uri.scheme,
          // TODO: use user authority,
          path:
            getStoreService().sessionStore.loggedInUserId +
            "/" +
            this.identifier.document +
            (tryN > 1 ? "-" + tryN : ""),
        })
      );

      const manager = await YDocSyncManager2.create(newIdentifier, this._ydoc);

      if (manager !== "already-exists") {
        await this.clearAndReload();
        return manager;
      }
      tryN++;
    } while (true);
  }

  public dispose() {
    this.disposed = true;
    super.dispose();
  }

  public static async create(identifier: Identifier, forkSource?: Y.Doc) {
    const manager = new YDocSyncManager2(identifier);
    const ret = await manager.create(forkSource);
    if (ret === "ok") {
      manager.initialize();
      return manager;
    }
    manager.dispose();
    return ret;
  }

  public static load(identifier: Identifier) {
    const manager = new YDocSyncManager2(identifier);
    manager.initialize();
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
