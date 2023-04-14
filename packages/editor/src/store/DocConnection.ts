import { computed, makeObservable, observable, reaction, when } from "mobx";
import { lifecycle } from "vscode-lib";
import { BaseResource } from "./BaseResource";

import * as Y from "yjs";
import { parseIdentifier, tryParseIdentifier } from "../identifiers";
import { Identifier } from "../identifiers/Identifier";
import { InboxResource } from "./InboxResource";
import { getStoreService } from "./local/stores";
import { YDocSyncManager2 } from "./yjs-sync/YDocSyncManager";

const cache = new Map<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends lifecycle.Disposable {
  private disposed: boolean = false;
  private _refCount = 0;

  /** @internal */
  private manager: YDocSyncManager2;
  private _baseResourceCache:
    | undefined
    | {
        baseResource: BaseResource;
        doc: Y.Doc;
      };

  protected constructor(
    public readonly identifier: Identifier,
    syncManager: YDocSyncManager2
  ) {
    super();

    this.manager = syncManager;

    // add "manager" to satisfy TS as it's a private field
    // https://mobx.js.org/observable-state.html#limitations
    makeObservable<DocConnection, "manager">(this, {
      doc: computed,
      tryDoc: computed,
      needsFork: computed,
      manager: observable.ref,
    });

    const dispose = reaction(
      () => getStoreService().sessionStore.user,
      () => {
        this._baseResourceCache = undefined;
        this.manager?.dispose();
        this.manager = YDocSyncManager2.load(identifier);
      },
      { fireImmediately: true }
    );

    this._register({
      dispose,
    });
  }
  /**
   * Returns the doc if loaded and available, or undefined otherwise
   *
   * (mobx computed)
   *
   * @readonly
   * @memberof DocConnection
   */
  public get tryDoc() {
    return typeof this.doc === "string" ? undefined : this.doc;
  }

  /** @internal */
  public get awareness() {
    return this.manager.awareness;
  }

  public get remote() {
    return this.manager.remote;
  }

  public get needsFork() {
    if (!this.manager) {
      return false;
    }
    return !this.manager.canWrite;
  }

  /**
   * Get the managed "doc". Returns:
   * - a BaseResource encapsulating the loaded doc if available
   * - "not-found" if the document doesn't exist locally / remote
   * - "loading" if we're still loading the document
   *
   * (mobx observable)
   *
   * @type {("loading" | "not-found" | BaseResource)}
   * @memberof DocConnection
   */
  public get doc() {
    if (!this.manager) {
      return "loading" as "loading";
    }

    const ydoc = this.manager.doc;
    if (typeof ydoc === "string") {
      return ydoc;
    }

    if (!this._baseResourceCache || this._baseResourceCache.doc !== ydoc) {
      this._baseResourceCache = {
        doc: ydoc,
        baseResource: new BaseResource(ydoc, this, () => {
          throw new Error("not implemetned");
        }),
      };
    }

    return this._baseResourceCache.baseResource;
  }

  public async revert() {
    this.manager.dispose();
    this.manager = await this.manager.clearAndReload();
  }

  // TODO: fork github or file sources
  public async fork() {
    if (!getStoreService().sessionStore.loggedInUserId) {
      throw new Error("not logged in");
    }

    const result = await this.manager.fork();

    if (typeof result === "string") {
      return result;
    }

    if (cache.get(result.identifier.toString())) {
      throw new Error("create called, but already in cache");
    }

    const connection = new DocConnection(result.identifier, result);
    cache.set(result.identifier.toString(), connection);
    connection.addRef();

    const doc = connection.doc;
    if (typeof doc === "string") {
      throw new Error("no baseresource after fork");
    }
    return doc;
  }

  public async waitForDoc() {
    await when(() => !!this.tryDoc);
    const doc = this.tryDoc;
    if (!doc) {
      throw new Error(
        "unexpected, doc not available after waiting in waitForDoc"
      );
    }
    return doc;
  }

  // public async reinitialize() {
  //   console.log("reinitialize", this.identifier.id);
  //   runInAction(() => {
  //     this.doc = "loading";
  //   });
  //   this.manager.dispose();
  //   await this.initializeNoCatch();
  // }

  public static async create(id: string | { owner: string; document: string }) {
    const sessionStore = getStoreService().sessionStore;
    if (!sessionStore.loggedInUserId) {
      throw new Error("no user available on create document");
    }
    const identifier = tryParseIdentifier(id);

    if (identifier === "invalid-identifier") {
      return identifier;
    }

    const syncManager = await YDocSyncManager2.create(identifier);

    if (syncManager === "already-exists") {
      return syncManager;
    }

    if (syncManager === "error") {
      return syncManager;
    }

    if (cache.get(identifier.toString())) {
      throw new Error("create called, but already in cache");
    }

    const connection = new DocConnection(identifier, syncManager);
    cache.set(identifier.toString(), connection);
    connection.addRef();

    return connection.waitForDoc();
  }

  // TODO
  public static inboxLoader = async (id: string) => {
    const con = DocConnection.load(id);
    await con.waitForDoc();
    const inbox = con.tryDoc!.getSpecificType<InboxResource>(
      InboxResource as any
    );
    return inbox;
  };

  public static load(
    identifier: string | { owner: string; document: string } | Identifier
  ) {
    // TODO
    if (!(identifier instanceof Identifier)) {
      identifier = parseIdentifier(identifier);
    }

    let connection = cache.get(identifier.toString());
    if (!connection) {
      const syncManager = YDocSyncManager2.load(identifier);

      connection = new DocConnection(identifier, syncManager);
      cache.set(identifier.toString(), connection);
    }
    connection.addRef();
    return connection;
  }

  // TODO: DELETE

  public addRef() {
    this._refCount++;
  }

  public dispose() {
    if (this._refCount === 0 || this.disposed) {
      throw new Error("already disposed or invalid refcount");
    }
    this._refCount--;
    console.log("dispose", this.identifier.toString(), this._refCount);
    if (this._refCount === 0) {
      super.dispose();

      this._baseResourceCache = undefined;
      this.manager.dispose();
      cache.delete(this.identifier.toString());
      this.disposed = true;
    }
  }
}
