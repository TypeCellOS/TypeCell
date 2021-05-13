import { Emitter } from "monaco-editor";
import slug from "speakingurl";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { observeDoc } from "../moby/doc";
import { Disposable } from "../util/vscode-common/lifecycle";
import { Event } from "../util/vscode-common/event";
import { BaseResource } from "./BaseResource";

const resourceCache = new Map<
  string,
  {
    connection: DocConnection;
    baseResource: BaseResource;
  }
>();

const docConnectionCache = new Map<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends Disposable {
  private disposed: boolean = false;
  private _refCount = 0;
  public readonly _ydoc;
  public readonly webrtcProvider: WebrtcProvider;
  public readonly indexedDBProvider: IndexeddbPersistence;

  private readonly _onWillDispose: Emitter<void> = this._register(
    new Emitter<void>()
  );

  public readonly onWillDispose: Event<void> = this._onWillDispose.event;

  private static readonly _onDocConnectionAdded: Emitter<DocConnection> = new Emitter<DocConnection>();

  public static readonly onDocConnectionAdded: Event<DocConnection> =
    DocConnection._onDocConnectionAdded.event;

  protected constructor(public readonly id: string) {
    super();
    if (!id.startsWith("@") || id.split("/").length !== 2) {
      throw new Error("invalid arguments for doc");
    }

    this._ydoc = new Y.Doc({ guid: id });
    this.webrtcProvider = new WebrtcProvider(id, this._ydoc);
    this.indexedDBProvider = new IndexeddbPersistence(id, this._ydoc);

    observeDoc(this._ydoc);
    DocConnection._onDocConnectionAdded.fire(this);
  }

  /**
   *
   * @deprecated only in use for search index atm
   */
  public static loadConnection(identifier: string) {
    let connection = docConnectionCache.get(identifier);
    if (!connection) {
      connection = new DocConnection(identifier);
      docConnectionCache.set(identifier, connection);
    }
    connection.addRef();
    return connection;
  }

  // TODO: move to BaseResource?
  public static load(
    identifier:
      | string
      | { owner: string; document: string; setInitialTitle?: boolean }
  ) {
    // let initialTitleToSet: string | undefined;

    if (typeof identifier !== "string") {
      const ownerSlug = slug(identifier.owner, {
        custom: {
          "@": "@", // tODO: necesary?
        },
      });
      const documentSlug = slug(identifier.document);
      if (!ownerSlug || !documentSlug) {
        throw new Error("invalid identifier");
      }

      if (!ownerSlug.startsWith("@")) {
        throw new Error("currently expecting owner to start with @");
      }

      // if (identifier.setInitialTitle) {
      //   initialTitleToSet = identifier.document;
      // }
      identifier = ownerSlug + "/" + documentSlug;
    }

    let entry = resourceCache.get(identifier);
    if (!entry) {
      const connection = new DocConnection(identifier);
      const baseResource = new BaseResource(connection);
      entry = { connection, baseResource };
      resourceCache.set(identifier, entry);
    }
    entry.connection.addRef();
    return entry.baseResource;
  }

  public base: any;

  public addRef() {
    this._refCount++;
  }

  public dispose() {
    if (this._refCount === 0 || this.disposed) {
      throw new Error("already disposed or invalid refcount");
    }
    this._refCount--;
    if (this._refCount === 0) {
      this._onWillDispose.fire();
      this.webrtcProvider.destroy();
      this.indexedDBProvider.destroy();
      resourceCache.delete(this.id);
      this.disposed = true;
    }
  }
}
