import { ObservableSet, autorun } from "mobx";
import { lifecycle } from "vscode-lib";
import { DocConnection } from "./DocConnection";
import { SessionStore } from "./local/SessionStore";
import { DocumentCoordinator } from "./yjs-sync/DocumentCoordinator";

export class BackgroundSyncer extends lifecycle.Disposable {
  private initialized = false;
  private loadedConnections = new Map<string, DocConnection>();
  private identifiersToSync = new ObservableSet<string>();

  constructor(
    private readonly coordinator: DocumentCoordinator,
    private readonly sessionStore: SessionStore
  ) {
    super();
    this._register({
      dispose: () => {
        for (let doc of this.loadedConnections.values()) {
          doc.dispose();
        }
      },
    });
  }

  public async initialize() {
    if (this.initialized) {
      throw new Error("already initialized");
    }
    this.initialized = true;

    const disposeAutorun = autorun(() => {
      const ids: string[] = [];
      this.coordinator.documents.forEach((docInfo, docId) => {
        if (docInfo.needs_save_since || !docInfo.exists_at_remote) {
          ids.push(docId);
        }
      });

      setTimeout(() => {
        // see which resources we need to sync
        for (let id of ids) {
          if (!this.identifiersToSync.has(id)) {
            console.log("bg syncer load", id);
            this.identifiersToSync.add(id);
            // we simply load the resource (DocConnection). It will create a SyncManager if there isn't one already, and start syncing automatically
            this.loadedConnections.set(
              id,
              DocConnection.load(id, this.sessionStore)
            );
          }
        }

        // cleanup already synced resources
        for (let id of this.identifiersToSync) {
          if (!ids.includes(id)) {
            // cleanup
            console.log("bg syncer unload", id);
            this.identifiersToSync.delete(id);
            const connection = this.loadedConnections.get(id)!;
            connection.dispose();
          }
        }
      }, 0); // settimeout is needed because otherwise it conflicts with creation in DocumentManager - this is a bit ugly

      this._register({
        dispose: () => {
          disposeAutorun();
        },
      });
    });
  }
}
