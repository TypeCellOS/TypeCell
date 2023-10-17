import { makeYDocObservable } from "@syncedstore/yjs-reactive-bindings";
import { observable } from "mobx";
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
  created_at: number;
  create_source: "local" | "remote";
  exists_at_remote: boolean;
  needs_save_since: number | undefined;
};

function COORDINATOR_IDB_ID(userId: string) {
  return userId + "-coordinator";
}

function DOC_IDB_ID(userId: string, docId: string) {
  return userId + "-doc-" + docId;
}

async function awaitSynced(provider: IndexeddbPersistence) {
  return await new Promise<void>((resolve) => {
    provider.once("synced", () => {
      resolve();
    });
  });
}

// https://blog.testdouble.com/posts/2019-05-14-locking-with-promises/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lockify = (f: any) => {
  let lock = Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...params: any) => {
    const result = lock.then(() => f(...params));
    lock = result.catch(() => {
      //noop
    });
    return result;
  };
};
export class DocumentCoordinator extends lifecycle.Disposable {
  public readonly loadedDocuments = observable.map<string, LocalDoc>(
    undefined,
    { deep: false },
  );

  private readonly doc: Y.Doc;
  private readonly indexedDBProvider: IndexeddbPersistence;

  constructor(private readonly userId: string) {
    super();
    this.doc = new Y.Doc();
    makeYDocObservable(this.doc);
    this.indexedDBProvider = new IndexeddbPersistence(
      COORDINATOR_IDB_ID(userId),
      this.doc,
    );

    this._register({
      dispose: () => {
        this.indexedDBProvider.destroy();
        this.doc.destroy();
      },
    });
  }

  public copyFromGuest = lockify(this.copyFromGuestNoLock.bind(this));

  private async copyFromGuestNoLock() {
    if (this.documents.size > 0) {
      throw new Error("copyFromGuest: target already has documents!");
    }
    const guestCoordinatorID = COORDINATOR_IDB_ID("user-tc-guest");
    if (!(await databaseExists(guestCoordinatorID))) {
      return false;
    }

    // copy coordinator
    const guestIDB = new IndexeddbPersistence(guestCoordinatorID, this.doc);

    await guestIDB.whenSynced;

    // copy docs
    const docs = this.documents.values();
    for (const doc of docs) {
      const typedDoc = doc as DocumentInfo;

      const ydoc = new Y.Doc();

      const guestDocIDB = new IndexeddbPersistence(
        DOC_IDB_ID("user-tc-guest", typedDoc.id),
        ydoc,
      );
      await awaitSynced(guestDocIDB);

      if (typedDoc.needs_save_since) {
        const targetDocIDB = new IndexeddbPersistence(
          DOC_IDB_ID(this.userId, typedDoc.id),
          ydoc,
        );
        await awaitSynced(targetDocIDB);
        ydoc.destroy();
        targetDocIDB.destroy();
      } else {
        ydoc.destroy();
      }
      guestDocIDB.destroy();
      await guestDocIDB.clearData();
    }
    guestIDB.destroy(); // needed because theoretically a ydoc transaction can happen while the indexeddb is being destroyed
    await guestIDB.clearData();
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
    targetYDoc: Y.Doc,
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
      created_at: Date.now(),
      create_source: "local",
      needs_save_since: Date.now(),
      exists_at_remote: false,
    };

    this.documents.set(idStr, { ...meta });

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
    targetYDoc: Y.Doc,
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
      created_at: Date.now(),
      create_source: "remote",
      needs_save_since: undefined,
      exists_at_remote: true,
    };

    this.documents.set(idStr, { ...meta });

    const ret = this.loadDocument(identifier, targetYDoc);
    if (ret === "not-found") {
      // can't happen, because it's just been created
      throw new Error("createDocumentFromRemote: document not found");
    }
    return ret;
  }

  // hacky fix for docs / httpidentifier
  public async clearIfNotChanged(identifier: Identifier) {
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

    if (meta.needs_save_since) {
      return "changed";
    }

    const doc = this.loadDocument(identifier, new Y.Doc());
    if (doc === "not-found") {
      throw new Error("unexpected: doc not found");
    }
    await this.deleteLocal(identifier);
    doc.ydoc.destroy();
  }

  /**
   * Load a local document if we have it in local storage
   * Otherwise return "not-found"
   */
  public loadDocument(
    identifier: Identifier,
    targetYDoc: Y.Doc,
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
        meta.needs_save_since = Date.now();
        this.documents.set(idStr, { ...meta });
      }
    });

    const idbProvider = new IndexeddbPersistence(
      DOC_IDB_ID(this.userId, idStr),
      targetYDoc,
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
    this.documents.set(localDoc.meta.id, { ...localDoc.meta });
  }

  public async markCreated(localDoc: LocalDoc) {
    localDoc.meta.exists_at_remote = true;
    this.documents.set(localDoc.meta.id, { ...localDoc.meta });
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
    const req = indexedDB.open(dbname);
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
