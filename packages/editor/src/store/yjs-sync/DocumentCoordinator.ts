import { lifecycle } from "vscode-lib";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { Identifier } from "../../identifiers/Identifier";

export type LocalDoc = {
  ydoc: Y.Doc;
  meta: DocumentInfo;
  idbProvider: IndexeddbPersistence;
};

export type DocumentInfo = {
  id: string;
  created_at: Date;
  create_source: "local" | "remote";
  updated_at: Date;
  last_synced_at: Date | null;
};

export class DocumentCoordinator extends lifecycle.Disposable {
  private loadedDocuments = new Map<string, LocalDoc>();

  private readonly doc: Y.Doc;
  private readonly indexedDBProvider: IndexeddbPersistence;

  constructor(private readonly userId: string) {
    super();
    this.doc = new Y.Doc();
    this.indexedDBProvider = new IndexeddbPersistence(
      userId + "-coordinator",
      this.doc
    );

    this._register({
      dispose: () => {
        this.doc.destroy();
      },
    });
  }

  public async initialize() {
    await this.indexedDBProvider.whenSynced;
  }

  /**
   * Return all info on documents that we have in our local-first storage
   */
  public get documents() {
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }
    return this.doc.getMap<DocumentInfo>("documents");
  }

  /**
   * Create and register a new document in our local store
   */
  public async createDocument(
    identifier: Identifier,
    targetYDoc: Y.Doc
  ): Promise<LocalDoc> {
    const idStr = identifier.toString();
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }
    if (this.documents.has(idStr) || this.loadedDocuments.has(idStr)) {
      throw new Error("createDocument: document already exists");
    }

    const meta: DocumentInfo = {
      id: idStr,
      created_at: new Date(),
      create_source: "local",
      updated_at: new Date(),
      last_synced_at: null,
    };

    this.documents.set(idStr, meta);

    const ret = this.loadDocument(identifier, targetYDoc);
    if (ret === "not-found") {
      // can't happen, because it's just been created
      throw new Error("createDocument: document not found");
    }
    return ret;
  }

  /**
   * Create a document in local storage that has been retrieved from a Remote
   */
  public createDocumentFromRemote(
    identifier: Identifier,
    targetYDoc: Y.Doc
  ): LocalDoc {
    const idStr = identifier.toString();
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }
    if (this.documents.has(idStr) || this.loadedDocuments.has(idStr)) {
      throw new Error("createDocument: document already exists");
    }

    const meta: DocumentInfo = {
      id: idStr,
      created_at: new Date(),
      create_source: "remote",
      updated_at: new Date(),
      last_synced_at: new Date(),
    };

    this.documents.set(idStr, meta);

    const ret = this.loadDocument(identifier, targetYDoc);
    if (ret === "not-found") {
      // can't happen, because it's just been created
      throw new Error("createDocumentFromRemote: document not found");
    }
    return ret;
  }

  /**
   * Load a local document if we have it in local storage
   * Otherwise return "not-found"
   */
  public loadDocument(
    identifier: Identifier,
    targetYDoc: Y.Doc
  ): LocalDoc | "not-found" {
    const idStr = identifier.toString();
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }

    if (this.loadedDocuments.has(idStr)) {
      // we expect loadDocument only to be called once per document
      throw new Error("loadDocument: document already loaded");
    }

    const meta = this.documents.get(idStr);

    if (!meta) {
      return "not-found";
    }

    targetYDoc.on("update", (update, origin) => {
      // console.log("update", origin);
      // for indexeddb, origin is null
      // for typecell (hocuspocus) or matrix, origin has .isRemote = true
      if (!origin || origin.isRemote) {
        return;
      }
      // mark change
      // TODO: mark synced on hocuspocus synced
    });

    const idbProvider = new IndexeddbPersistence(
      this.userId + "-doc-" + idStr,
      targetYDoc
    );

    const doc: LocalDoc = {
      ydoc: targetYDoc,
      meta,
      idbProvider,
    };

    targetYDoc.on("destroy", () => {
      this.loadedDocuments.delete(idStr);
    });

    this.loadedDocuments.set(idStr, doc);
    return doc;
  }

  /**
   * Delete a document from our local storage
   */
  public async deleteLocal(identifier: Identifier) {
    const idStr = identifier.toString();
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }

    const localDoc = this.loadedDocuments.get(idStr);

    if (!localDoc) {
      // we expect loadDocument only to be called once per document
      throw new Error("loadDocument: document already loaded");
    }

    await localDoc.idbProvider.clearData();

    this.loadedDocuments.delete(idStr);
    this.documents.delete(idStr);
  }

  public async markSynced(localDoc: LocalDoc) {
    localDoc.meta.last_synced_at = new Date();
    this.documents.set(localDoc.meta.id, localDoc.meta);
  }
}

/*
TODO:
- what if open in multiple tabs? can ydoc change?

- service that listens for documents that need to be synced
- on creating a doc -> create locally, then sync
--> this might be handled automatically
- on opening a doc -> always sync
- on loading a doc -> load from remote, then sync to local


*/
