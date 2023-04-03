import { makeObservable, observable } from "mobx";
import { lifecycle } from "vscode-lib";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
export abstract class Remote extends lifecycle.Disposable {
  public status: "loading" | "not-found" | "loaded" = "loading"; // TODO: make this a getter
  // public replacementDoc: Y.Doc | undefined;

  protected abstract readonly id: string;
  // protected readonly pendingOperationsDoc: Y.Doc;
  public abstract canCreate: boolean;
  public abstract get canWrite(): boolean;

  constructor(
    protected readonly _ydoc: Y.Doc,
    protected readonly awareness: Awareness
  ) {
    super();
    // this.pendingOperationsDoc = new Y.Doc();
    // should be user scoped
    // new IndexeddbPersistence(this.id, this.pendingOperationsDoc);
    makeObservable(this, {
      status: observable.ref,
      // replacementDoc: observable.ref,
    });
  }

  public abstract load(): Promise<void>;

  public create(): Promise<"already-exists" | "ok" | "error"> {
    throw new Error("not implemented");
  }
}

// SyncManager: holds a doc and responsible for loading / creating + syncing to local

// Remote, responsible for:
// caching sync / create / delete operations that were made offline
// - executing those when back online
// later: periodically updating docs from remote (e.g.: when user is offline)
