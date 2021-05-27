import {
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
  when,
} from "mobx";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import MatrixProvider from "../matrix-yjs/MatrixProvider";
import { createMatrixDocument } from "../matrix-yjs/MatrixRoomManager";

import { observeDoc } from "../moby/doc";
import { Disposable } from "../util/vscode-common/lifecycle";
import { Event, Emitter } from "../util/vscode-common/event";
import { BaseResource } from "./BaseResource";
import { Identifier, parseIdentifier, tryParseIdentifier } from "./Identifier";
import { sessionStore } from "./local/stores";

// TODO, extract cache + global function to Manager object / class
const cache = new Map<string, DocConnection>();

export function reloadDocuments() {
  if (cache.size) {
    console.log("reloading documents");
  }
  for (let doc of cache.values()) {
    doc.reinitialize().catch((e) => {
      console.error("error reinitializing document", e);
    });
  }
}

export function readOnlyAccess() {
  if (typeof sessionStore.user === "string") {
    return false;
  }
  return sessionStore.user.type === "guest-user";
}

export function setupDocConnectionManager() {
  reaction(
    () => readOnlyAccess(),
    () => {
      reloadDocuments();
    }
  );
}

const docConnectionCache = new Map<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends Disposable {
  public disposed: boolean = false;
  private _refCount = 0;
  /** @internal */
  public _ydoc: Y.Doc; // TODO: make private

  /** @internal */
  public matrixProvider: MatrixProvider | undefined;

  /** @internal */
  public webrtcProvider: WebrtcProvider | undefined;

  /** @internal */
  public indexedDBProvider: IndexeddbPersistence | undefined;

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
  public doc: "loading" | "not-found" | BaseResource = "loading";

  private readonly _onWillDispose: Emitter<void> = this._register(
    new Emitter<void>()
  );

  public readonly onWillDispose: Event<void> = this._onWillDispose.event;

  private static readonly _onDocConnectionAdded: Emitter<DocConnection> =
    new Emitter<DocConnection>();

  public static readonly onDocConnectionAdded: Event<DocConnection> =
    DocConnection._onDocConnectionAdded.event;

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

  protected constructor(
    public readonly identifier: Identifier,
    offline = false
  ) {
    super();

    console.log("new docconnection", this.identifier.id);
    this._ydoc = new Y.Doc({ guid: this.identifier.id });

    observeDoc(this._ydoc);
    DocConnection._onDocConnectionAdded.fire(this);
    makeObservable(this, {
      doc: observable.ref,
      tryDoc: computed,
    });
    this.initialize(offline);
  }

  public async reinitialize() {
    console.log("reinitialize", this.identifier.id);
    runInAction(() => {
      this.doc = "loading";
    });
    this.webrtcProvider?.destroy();
    this.indexedDBProvider?.destroy();
    this.webrtcProvider = undefined;
    this.indexedDBProvider = undefined;
    this.matrixProvider?.dispose();
    this.matrixProvider = undefined;
    await this.initializeNoCatch();
  }

  private async initialize(offline = false) {
    try {
      await this.initializeNoCatch(offline);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async initializeNoCatch(offline = false) {
    if (typeof sessionStore.user === "string") {
      throw new Error("no matrix client available");
    }
    const mxClient = sessionStore.user.matrixClient;
    const readonly = readOnlyAccess();
    const alreadyLocal = !readonly && (await existsLocally(this.identifier.id));

    if (readonly && offline) {
      throw new Error("unexpected; both readonly and offline");
    }

    const initLocalProviders = async () => {
      if (typeof this.doc !== "string") {
        // already loaded
        return;
      }

      if (!readonly) {
        await new Promise<void>((resolve, reject) => {
          try {
            // TODO: add user id to indexeddb id?
            this.indexedDBProvider = new IndexeddbPersistence(
              "yjs-" + this.identifier.id,
              this._ydoc
            );

            this.indexedDBProvider.on("synced", () => {
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
      }

      this.webrtcProvider = new WebrtcProvider(this.identifier.id, this._ydoc);
      runInAction(() => {
        this.doc = new BaseResource(this._ydoc, this);
      });
    };

    if (alreadyLocal || offline) {
      // For alreadyLocal,
      // we await here to first load indexeddb, and then later sync with remote providers
      // This way, when we set up MatrixProvider, we also have an initial state
      // and can detect whether any local changes need to be synced to the remote (matrix)

      // for offline, make sure we create the local document, because onDocumentAvailable
      // won't resolve until we become online
      await initLocalProviders();
    }

    this.matrixProvider = this._register(
      new MatrixProvider(this._ydoc, mxClient, this.identifier.id, readonly)
    );

    this._register(
      this.matrixProvider.onDocumentAvailable(() => {
        initLocalProviders();
      })
    );

    this._register(
      this.matrixProvider.onDocumentUnavailable(() => {
        // TODO: tombstone?
        runInAction(() => {
          this.doc = "not-found";
        });
        this.indexedDBProvider?.destroy();
        this.webrtcProvider?.destroy();
        this.indexedDBProvider = undefined;
        this.webrtcProvider = undefined;
      })
    );
  }

  public static async create(id: string | { owner: string; document: string }) {
    const identifier = tryParseIdentifier(id);

    if (typeof identifier === "string") {
      return identifier;
    }

    if (await existsLocally(identifier.id)) {
      return "already-exists";
    }
    const remoteResult = await createMatrixDocument(
      identifier.owner,
      identifier.id
    );

    if (remoteResult === "offline" || remoteResult === "ok") {
      // TODO: add to pending if "offline"
      const connection = await DocConnection.load(
        id,
        remoteResult === "offline"
      );

      const doc = await connection.waitForDoc();
      doc.create("!richtext");
      return doc;
    }

    return remoteResult;
  }

  public static load(
    id: string | { owner: string; document: string },
    offline = false
  ) {
    const identifier = parseIdentifier(id);

    let connection = cache.get(identifier.id);
    if (!connection) {
      connection = new DocConnection(identifier, offline);
      cache.set(identifier.id, connection);
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
    console.log("dispose", this.identifier.id, this._refCount);
    if (this._refCount === 0) {
      super.dispose();
      this._onWillDispose.fire();
      this.webrtcProvider?.destroy();
      this.indexedDBProvider?.destroy();
      this.webrtcProvider = undefined;
      this.indexedDBProvider = undefined;
      cache.delete(this.identifier.id);
      this.disposed = true;
      super.dispose();
    }
  }
}

async function existsLocally(id: string) {
  const exists = (await (window.indexedDB as any).databases())
    .map((db: IDBDatabase) => db.name)
    .includes("yjs-" + id);
  return exists;
}
