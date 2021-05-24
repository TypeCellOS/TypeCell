import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";
import { observeDoc } from "../moby/doc";
import { slug } from "../util/slug";
import { BaseResource } from "./BaseResource";

const cache = new Map<
  string,
  {
    connection: DocConnection;
    baseResource: BaseResource;
  }
>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection {
  private disposed: boolean = false;
  private _refCount = 0;
  public readonly _ydoc;
  public readonly webrtcProvider: WebrtcProvider;
  public readonly indexedDBProvider: IndexeddbPersistence;

  protected constructor(public readonly id: string) {
    if (!id.startsWith("@") || id.split("/").length !== 2) {
      throw new Error("invalid arguments for doc");
    }

    this._ydoc = new Y.Doc({ guid: id });
    this.webrtcProvider = new WebrtcProvider(id, this._ydoc);
    this.indexedDBProvider = new IndexeddbPersistence(id, this._ydoc);

    observeDoc(this._ydoc);
  }

  public static load(
    identifier:
      | string
      | { owner: string; document: string; setInitialTitle?: boolean }
  ) {
    // let initialTitleToSet: string | undefined;

    if (typeof identifier !== "string") {
      const ownerSlug = slug(identifier.owner);
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

    let entry = cache.get(identifier);
    if (!entry) {
      const connection = new DocConnection(identifier);
      const baseResource = new BaseResource(connection);
      entry = { connection, baseResource };
      cache.set(identifier, entry);
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
      this.webrtcProvider.destroy();
      this.indexedDBProvider.destroy();
      cache.delete(this.id);
      this.disposed = true;
    }
  }
}
