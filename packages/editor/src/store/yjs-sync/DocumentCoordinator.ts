import { lifecycle } from "vscode-lib";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { Identifier } from "../../identifiers/Identifier";

export type LocalDoc = {
  ydoc: Y.Doc;
  meta: Document;
  idbProvider: IndexeddbPersistence;
};

export type Document = {
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

  public get documents() {
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }
    return this.doc.getMap<Document>("documents");
  }

  // create a new document locally
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

    const meta: Document = {
      id: idStr,
      created_at: new Date(),
      create_source: "local",
      updated_at: new Date(),
      last_synced_at: null,
    };

    this.documents.set(idStr, meta);

    // TODO: listen to updates

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

    const meta: Document = {
      id: idStr,
      created_at: new Date(),
      create_source: "remote",
      updated_at: new Date(),
      last_synced_at: null,
    };

    this.documents.set(idStr, meta);

    // TODO: listen to updates

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

  // load a document from local store
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
      //   this.documents.set(idStr, {
      //     id: idStr,
      //     created_at: new Date(),
      //     create_source: "remote",
      //     updated_at: new Date(),
      //     last_synced_at: null,
      //   });

      return "not-found";
    }

    // TODO: listen to updates

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

  public async deleteLocal(identifier: Identifier) {
    const idStr = identifier.toString();
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }

    const localDoc = this.loadedDocuments.get("idStr");

    if (!localDoc) {
      // we expect loadDocument only to be called once per document
      throw new Error("loadDocument: document already loaded");
    }

    await localDoc.idbProvider.clearData();

    this.loadedDocuments.delete(idStr);
    this.documents.delete(idStr);
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
