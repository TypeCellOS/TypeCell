import {
  ObservableMap,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
  when,
} from "mobx";
import { lifecycle } from "vscode-lib";
import { BaseResource } from "./BaseResource";

import * as Y from "yjs";
import { parseIdentifier } from "../identifiers";
import { Identifier } from "../identifiers/Identifier";
import { TypeCellIdentifier } from "../identifiers/TypeCellIdentifier";
import { InboxResource } from "./InboxResource";
import { SessionStore } from "./local/SessionStore";
import { getStoreService } from "./local/stores";
import { ForkReference } from "./referenceDefinitions/fork";
import { SyncManager } from "./yjs-sync/SyncManager";

const cache = new ObservableMap<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends lifecycle.Disposable {
  private disposed: boolean = false;
  private _refCount = 0;

  /** @internal */
  private manager: SyncManager | undefined;
  private _baseResourceCache: undefined | BaseResource;

  protected constructor(
    public readonly identifier: Identifier,
    syncManager: SyncManager,
    private readonly sessionStore: SessionStore
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
      () => this.sessionStore.documentCoordinator,
      async () => {
        console.log(
          "sessionstore change",
          this.sessionStore.documentCoordinator
        );

        this._baseResourceCache = undefined;
        this.manager?.dispose();
        let newManager: SyncManager | undefined = undefined;

        if (sessionStore.user && sessionStore.documentCoordinator) {
          newManager = SyncManager.load(identifier, this.sessionStore);
        }
        runInAction(() => {
          this.manager = newManager;
        });
      },
      { fireImmediately: false }
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
    console.log("awareness", this.manager?.awareness);
    return this.manager?.awareness;
  }

  public get remote() {
    return this.manager?.remote;
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
  public get doc(): "loading" | "not-found" | BaseResource {
    if (!this.manager) {
      return "loading" as "loading";
    }

    const ydoc = this.manager.docOrStatus;
    if (typeof ydoc === "string") {
      return ydoc;
    }

    if (!this._baseResourceCache || this._baseResourceCache.ydoc !== ydoc) {
      this._baseResourceCache = new BaseResource(ydoc, this.identifier, this);
    }

    return this._baseResourceCache;
  }

  public async revert() {
    const manager = await this.manager!.clearAndReload();
    runInAction(() => {
      this.manager = manager;
    });
  }

  // TODO: fork github or file sources
  public async fork() {
    if (!this.sessionStore.loggedInUserId) {
      throw new Error("fork, but not logged in");
    }

    const doc = this.tryDoc;
    if (!doc) {
      throw new Error("fork, but no doc");
    }

    const connection = await DocConnection.createNewDocConnection(
      this.sessionStore.getIdentifierForNewDocument(),
      this.sessionStore,
      doc.ydoc
    );

    await this.revert();

    const forkDoc = await connection.waitForDoc();

    await forkDoc.addRef(ForkReference, this.identifier);
    return forkDoc;
  }

  private static async createNewDocConnection(
    identifier: Identifier,
    sessionStore: SessionStore,
    forkSource?: Y.Doc,
    isInbox = false
  ) {
    const cacheKey = DocConnection.getCacheKey(sessionStore, identifier);
    if (cache.has(cacheKey)) {
      throw new Error("unexpected, doc already in cache");
    }

    if (!isInbox && identifier.toString().endsWith("/.inbox")) {
      throw new Error("unexpected, inbox identifier");
    }

    if (!isInbox) {
      const inboxIdentifier = parseIdentifier(
        identifier.toString() + "/.inbox"
      );
      const inboxConnection = await DocConnection.createNewDocConnection(
        inboxIdentifier,
        sessionStore,
        undefined,
        true
      );

      const doc = await inboxConnection.waitForDoc();
      doc.create("!inbox");
      doc.ydoc.getMap("inboxmeta").set("target", identifier.toString()); // TODO

      // we can dispose immediately, bg manager is responsible for syncing the change
      inboxConnection.dispose();
    }

    const manager = SyncManager.create(identifier, sessionStore, forkSource);

    const connection = new DocConnection(
      manager.identifier,
      manager,
      sessionStore
    );
    cache.set(cacheKey, connection);
    connection.addRef();
    return connection;
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

  public loadInboxResource = (id: Identifier) =>
    DocConnection.loadInboxResource(id, this.sessionStore);

  public static async loadInboxResource(
    id: Identifier,
    sessionStore = getStoreService().sessionStore
  ): Promise<InboxResource> {
    if (!(id instanceof TypeCellIdentifier)) {
      throw new Error(
        "unimplemented, only typecellidentifier supported for loadInboxResource"
      );
    }
    if (id.toString().endsWith("/.inbox")) {
      throw new Error("unexpected, inbox identifier");
    }
    // console.log("loadInboxResource", id.toString() + "/.inbox");
    const doc = DocConnection.load(
      parseIdentifier(id.toString() + "/.inbox"),
      sessionStore
    );
    const ret = await doc.waitForDoc();
    const inbox = ret.getSpecificType<InboxResource>(InboxResource as any);
    return inbox;
  }

  // TODO: async or not?
  public static async create(sessionStore = getStoreService().sessionStore) {
    if (!sessionStore.loggedInUserId) {
      // Note: can happen on sign up
      console.warn(
        "DocConnection: no loggedInUserId available on create document"
      );
    }

    const identifier = sessionStore.getIdentifierForNewDocument();

    // TODO: async or not?
    const connection = await DocConnection.createNewDocConnection(
      identifier,
      sessionStore
    );

    return connection.waitForDoc();
  }

  public static get(
    identifier: string | Identifier,
    sessionStore = getStoreService().sessionStore
  ) {
    if (!(identifier instanceof Identifier)) {
      identifier = parseIdentifier(identifier);
    }

    let connection = cache.get(
      DocConnection.getCacheKey(sessionStore, identifier)
    );
    return connection;
  }

  public static load(
    identifier: string | Identifier,
    sessionStore = getStoreService().sessionStore
  ) {
    if (!(identifier instanceof Identifier)) {
      identifier = parseIdentifier(identifier);
    }

    const cacheKey = DocConnection.getCacheKey(sessionStore, identifier);
    let connection = cache.get(cacheKey);
    if (!connection) {
      const syncManager = SyncManager.load(identifier, sessionStore);

      connection = new DocConnection(identifier, syncManager, sessionStore);
      cache.set(cacheKey, connection);
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
      this.manager?.dispose();
      cache.delete(this.getCacheKey());
      this.disposed = true;
    }
  }

  private getCacheKey() {
    return DocConnection.getCacheKey(this.sessionStore, this.identifier);
  }

  private static getCacheKey(
    sessionStore: SessionStore,
    identifier: Identifier
  ) {
    return sessionStore.userPrefix + identifier.toString();
  }
}
