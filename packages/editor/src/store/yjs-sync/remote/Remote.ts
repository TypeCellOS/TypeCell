import { makeObservable, observable } from "mobx";
import { async, lifecycle } from "vscode-lib";

import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
export abstract class Remote extends lifecycle.Disposable {
  public status: "loading" | "not-found" | "loaded" = "loading"; // TODO: make this a getter
  // public replacementDoc: Y.Doc | undefined;

  protected abstract readonly id: string;
  // protected readonly pendingOperationsDoc: Y.Doc;
  public abstract canCreate: boolean;
  public abstract get canWrite(): boolean;
  public abstract get awareness(): Awareness | undefined;

  constructor(protected readonly _ydoc: Y.Doc) {
    super();
    // this.pendingOperationsDoc = new Y.Doc();
    // should be user scoped
    // new IndexeddbPersistence(this.id, this.pendingOperationsDoc);
    makeObservable(this, {
      status: observable.ref,
      // replacementDoc: observable.ref,
    });
  }

  public abstract startSyncing(): Promise<void>;

  protected create(): Promise<"already-exists" | "ok" | "error"> {
    throw new Error("not implemented");
  }

  public async createAndRetry() {
    if (this.status === "loaded") {
      throw new Error("already loaded");
    }

    if (!this.canCreate) {
      throw new Error("cannot create");
    }

    let cleanup = {
      cancel: () => {},
    };

    this._register({
      dispose: () => cleanup.cancel(),
    });

    while (true) {
      const ret = await this.create();
      if (ret !== "error") {
        break;
      }

      const p = async.timeout(10000);
      cleanup.cancel = p.cancel;
      await p;
    }
  }
}
/*
TODO: test, for providers
- do we retrying creating when offline -> online
- do we keep retrying sync when offline -> online
- do we keep retrying load when offline -> online


// SyncManager: holds a doc and responsible for loading / creating + syncing to local

// Remote, responsible for:
// caching sync / create / delete operations that were made offline
// - executing those when back online
// later: periodically updating docs from remote (e.g.: when user is offline)

// last synced at
// last modified at
// created at (local)
// created at (remote)
// TODO: delete

// of per remote?
// - last synced at
*/
