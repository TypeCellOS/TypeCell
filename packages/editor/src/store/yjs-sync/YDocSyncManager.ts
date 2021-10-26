import { MatrixProvider } from "@typecell-org/matrix-yjs";
import { MatrixClient } from "matrix-js-sdk";
import { createAtom, makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
import { IndexeddbPersistence } from "y-indexeddb";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { Identifier } from "../../identifiers/Identifier";
import { MatrixIdentifier } from "../../identifiers/MatrixIdentifier";
import { existsLocally, getIDBIdentifier, waitForIDBSynced } from "./IDBHelper";
import { SyncManager } from "./SyncManager";
/**
 * Given an identifier, manages local + remote syncing of a Y.Doc
 */
export class YDocSyncManager
  extends lifecycle.Disposable
  implements SyncManager
{
  private readonly _ydoc: Y.Doc;
  private initializeCalled = false;
  private _canWriteAtom = createAtom("_canWrite");

  public readonly awareness: awarenessProtocol.Awareness;
  public readonly idbIdentifier: string;

  public get canWrite() {
    this._canWriteAtom.reportObserved();
    if (!this.matrixProvider) {
      return true;
    }
    return this.matrixProvider.canWrite;
  }

  /** @internal */
  public matrixProvider: MatrixProvider | undefined;

  /** @internal */
  public webrtcProvider: { awareness: any } | undefined;

  /** @internal */
  public indexedDBProvider: IndexeddbPersistence | undefined;

  /**
   * Get the managed "doc". Returns:
   * - a Y.Doc encapsulating the loaded doc if available
   * - "not-found" if the document doesn't exist locally / remote
   * - "loading" if we're still loading the document
   *
   * (mobx observable)
   *
   * @type {("loading" | "not-found" | Y.Doc)}
   * @memberof DocConnection
   */
  public doc: "loading" | "not-found" | Y.Doc = "loading";

  public constructor(
    public readonly identifier: MatrixIdentifier,
    private readonly mxClient: MatrixClient,
    private readonly userId: string | undefined,
    private readonly forkSourceIdentifier?: Identifier
  ) {
    super();
    this.idbIdentifier = getIDBIdentifier(
      this.identifier.toString(),
      this.userId
    );
    makeObservable(this, {
      doc: observable.ref,
    });

    this._ydoc = new Y.Doc({ guid: this.identifier.toString() });
    this.awareness = new awarenessProtocol.Awareness(this._ydoc);
  }

  public async initialize() {
    try {
      if (this.initializeCalled) {
        throw new Error("already called initialize() on YDocSyncManager");
      }
      this.initializeCalled = true;
      await this.initializeNoCatch();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async applyChangesFromAndDeleteSource(idbIdentifier: string) {
    const guestIndexedDBProvider = new IndexeddbPersistence(
      idbIdentifier,
      this._ydoc
    );
    await waitForIDBSynced(guestIndexedDBProvider);
    await guestIndexedDBProvider.clearData();
  }

  /**
   * scenario 1:
   * - not signed in (guest)
   * - makes changes to @user1/doc, these are saved in guest-@user1/doc
   * - signs in as @user2: changes from guest-@user1/doc need to move to u-@user2-@user1/doc
   *
   * scenario 2:
   * - signed in as @user2
   * - makes changes to @user1/doc, these are saved to u-@user2-@user1/doc
   * - forks, u-@user2-@user1/doc needs to move to u-@user2-@user2/doc
   */
  private async initLocalProviders() {
    if (this.indexedDBProvider) {
      throw new Error("already has indexedDBProvider");
    }

    this.indexedDBProvider = new IndexeddbPersistence(
      this.idbIdentifier,
      this._ydoc
    );

    await waitForIDBSynced(this.indexedDBProvider);

    // scenario 1
    if (this.userId) {
      const guestIDB = getIDBIdentifier(this.identifier.toString(), undefined);
      if (await existsLocally(guestIDB)) {
        console.log("copying guest idb");
        await this.applyChangesFromAndDeleteSource(guestIDB);
      }
    }

    // scenario 2
    if (this.forkSourceIdentifier) {
      if (!this.userId) {
        throw new Error("unexpected, forkSource but no userId");
      }
      const idbId = getIDBIdentifier(
        this.forkSourceIdentifier.toString(),
        this.userId
      );
      if (!existsLocally(idbId)) {
        throw new Error("fork source not found");
      }
      await this.applyChangesFromAndDeleteSource(idbId);
    }

    if (this.webrtcProvider) {
      throw new Error("already has webrtcProvider");
    }
    runInAction(() => {
      this.doc = this._ydoc;
    });
  }

  public async deleteLocalChanges() {
    if (!this.indexedDBProvider) {
      throw new Error("deleteLocalChanges() called without indexedDBProvider");
    }
    await this.indexedDBProvider.clearData();
    this.indexedDBProvider.destroy();
    this.indexedDBProvider = undefined;
  }

  private async initializeNoCatch() {
    // const mxClient = YDocSyncManager.matrixClient;
    // if (!mxClient) {
    //   throw new Error("no matrix client available");
    // }
    const alreadyLocal = await existsLocally(this.idbIdentifier);

    if (typeof this.doc !== "string") {
      throw new Error("already loaded");
    }

    if (alreadyLocal) {
      // For alreadyLocal,
      // we await here to first load indexeddb, and then later sync with remote providers
      // This way, when we set up MatrixProvider, we also have an initial state
      // and can detect whether any local changes need to be synced to the remote (matrix)
      await this.initLocalProviders();
    }

    this.matrixProvider = this._register(
      new MatrixProvider(
        this._ydoc,
        this.mxClient,
        this.identifier.roomName,
        this.identifier.uri.authority,
        this.awareness
      )
    );

    this.matrixProvider.initialize();
    this._canWriteAtom.reportChanged();

    this._register(
      this.matrixProvider.onCanWriteChanged(() => {
        this._canWriteAtom.reportChanged();
      })
    );

    this._register(
      this.matrixProvider.onDocumentAvailable(() => {
        if (!this.indexedDBProvider) {
          this.initLocalProviders();
        }
      })
    );

    this._register(
      this.matrixProvider.onDocumentUnavailable(() => {
        // TODO: tombstone?
        runInAction(() => {
          this.doc = "not-found";
        });
        this.indexedDBProvider?.destroy();
        this.indexedDBProvider = undefined;
        this.webrtcProvider = undefined;
      })
    );
  }

  public dispose() {
    super.dispose();
    this.indexedDBProvider?.destroy();
    this.indexedDBProvider = undefined;
    this.webrtcProvider = undefined;
    this.matrixProvider = undefined;
  }

  public on() {}
}
