import { makeYDocObservable } from "@syncedstore/yjs-reactive-bindings";
import { lifecycle } from "vscode-lib";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";

export class AliasCoordinator extends lifecycle.Disposable {
  private readonly doc: Y.Doc;
  private readonly indexedDBProvider: IndexeddbPersistence;

  constructor(private readonly userId: string) {
    super();
    this.doc = new Y.Doc();
    makeYDocObservable(this.doc);
    this.indexedDBProvider = new IndexeddbPersistence(
      userId + "-aliases",
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

  public get aliases() {
    if (!this.indexedDBProvider.synced) {
      throw new Error("not initialized");
    }
    return this.doc.getMap<string>("aliases");
  }
}
