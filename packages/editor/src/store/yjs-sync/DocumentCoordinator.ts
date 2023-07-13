import { makeYDocObservable } from "@syncedstore/yjs-reactive-bindings";
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
  exists_at_remote: boolean;
  needs_save_since: Date | undefined;
};

export class DocumentCoordinator extends lifecycle.Disposable {
  private loadedDocuments = new Map<string, LocalDoc>();

  private readonly doc: Y.Doc;
  private readonly indexedDBProvider: IndexeddbPersistence;

  constructor(private readonly userId: string) {
    super();
    this.doc = new Y.Doc();
    makeYDocObservable(this.doc);
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
      needs_save_since: new Date(),
      exists_at_remote: false,
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
      needs_save_since: undefined,
      exists_at_remote: true,
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

    // console.log("Coordinator load debug", idStr, this.userId);
    if (this.loadedDocuments.has(idStr)) {
      // we expect loadDocument only to be called once per document
      throw new Error("loadDocument: document already loaded");
    }

    const meta = this.documents.get(idStr);

    if (!meta) {
      return "not-found";
    }

    targetYDoc.on("update", (_update, origin) => {
      // for indexeddb, origin is null
      // for typecell (hocuspocus) or matrix, origin has .isRemote = true
      if (!origin || origin.isRemote) {
        return;
      }
      // mark change
      const meta = this.documents.get(idStr);

      if (!meta) {
        throw new Error("document meta not found");
      }

      if (meta.needs_save_since === undefined) {
        meta.needs_save_since = new Date();
        this.documents.set(idStr, meta);
      }
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
    localDoc.meta.needs_save_since = undefined;
    this.documents.set(localDoc.meta.id, localDoc.meta);
  }

  public async markCreated(localDoc: LocalDoc) {
    localDoc.meta.exists_at_remote = true;
    this.documents.set(localDoc.meta.id, localDoc.meta);
  }

  public async loadFromGuest(identifier: string, targetYdoc: Y.Doc) {
    const dbname = "user-tc-guest-doc-" + identifier; // bit hacky, "officially" we don't know the exact source name prefix here
    let dbExists = await databaseExists(dbname);

    if (dbExists) {
      const guestIndexedDBProvider = new IndexeddbPersistence(
        dbname,
        targetYdoc
      );
      // wait for sync
      await new Promise<void>((resolve) => {
        guestIndexedDBProvider.once("synced", () => {
          resolve();
        });
      });
      guestIndexedDBProvider.destroy();
      console.log("applied changes from guest");
      return true;
    } else {
      console.log("did not apply changes from guest");
      return false;
    }
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

// https://stackoverflow.com/a/23756653
async function databaseExists(dbname: string) {
  return new Promise<boolean>((resolve) => {
    let req = indexedDB.open(dbname);
    let existed = true;
    req.onsuccess = function () {
      req.result.close();
      if (!existed) {
        indexedDB.deleteDatabase(dbname);
      }
      resolve(existed);
    };
    req.onupgradeneeded = function () {
      existed = false;
    };
  });
}
