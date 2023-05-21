import {
  ObservableMap,
  computed,
  makeObservable,
  observable,
  reaction,
  when,
} from "mobx";
import { lifecycle } from "vscode-lib";
import { BaseResource } from "./BaseResource";

import * as Y from "yjs";
import { parseIdentifier } from "../identifiers";
import { Identifier } from "../identifiers/Identifier";
import { InboxResource } from "./InboxResource";
import { getStoreService } from "./local/stores";
import { SyncManager } from "./yjs-sync/SyncManager";

const cache = new ObservableMap<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends lifecycle.Disposable {
  private disposed: boolean = false;
  private _refCount = 0;

  /** @internal */
  private manager: SyncManager;
  private _baseResourceCache:
    | undefined
    | {
        baseResource: BaseResource;
        doc: Y.Doc;
      };

  protected constructor(
    public readonly identifier: Identifier,
    syncManager: SyncManager
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
      () => getStoreService().sessionStore.documentCoordinator,
      async () => {
        console.log(
          "sessionstore change",
          getStoreService().sessionStore.documentCoordinator
        );
        const sessionStore = getStoreService().sessionStore;
        this._baseResourceCache = undefined;
        this.manager?.dispose();
        if (!sessionStore.user || !sessionStore.documentCoordinator) {
          return;
        }
        this.manager = SyncManager.load(
          identifier,
          getStoreService().sessionStore
        );
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
    console.log("awareness", this.manager.awareness);
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

    const ydoc = this.manager.docOrStatus;
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

    throw new Error("TODO");
    /*
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
    return doc;*/
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

  // TODO: async or not?
  public static async create() {
    const sessionStore = getStoreService().sessionStore;
    if (!sessionStore.loggedInUserId) {
      // Note: can happen on sign up
      console.warn(
        "DocConnection: no loggedInUserId available on create document"
      );
    }

    const identifier = sessionStore.getIdentifierForNewDocument();
    // TODO: async or not?
    const syncManager = SyncManager.create(
      identifier,
      getStoreService().sessionStore
    );

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

  public static get(identifier: string | Identifier) {
    if (!(identifier instanceof Identifier)) {
      identifier = parseIdentifier(identifier);
    }

    let connection = cache.get(identifier.toString());
    return connection;
  }

  public static load(identifier: string | Identifier) {
    if (!(identifier instanceof Identifier)) {
      identifier = parseIdentifier(identifier);
    }

    let connection = cache.get(identifier.toString());
    if (!connection) {
      const syncManager = SyncManager.load(
        identifier,
        getStoreService().sessionStore
      );

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
