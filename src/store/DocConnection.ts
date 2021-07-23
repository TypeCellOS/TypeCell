import {
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
  when,
} from "mobx";
import { MatrixClientPeg } from "../matrix-auth/MatrixClientPeg";
import { createMatrixDocument } from "../matrix-yjs/MatrixRoomManager";
import { Disposable } from "../util/vscode-common/lifecycle";
import { BaseResource } from "./BaseResource";
import {
  Identifier,
  parseTypeCellIdentifier,
  tryParseTypeCellIdentifier,
} from "./Identifier";
import { sessionStore } from "./local/stores";
import { existsLocally, getIDBIdentifier } from "./yjs-sync/IDBHelper";
import { YDocSyncManager } from "./yjs-sync/YDocSyncManager";

const cache = new Map<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends Disposable {
  private disposed: boolean = false;
  private _refCount = 0;

  /** @internal */
  private manager: YDocSyncManager | undefined;
  private _baseResource: BaseResource | undefined;

  private clearAndInitializeManager(forkSourceIdentifier?: Identifier) {
    runInAction(() => {
      this._baseResource = undefined;
      this.manager?.dispose();
      this.manager = undefined;
      if (typeof sessionStore.user !== "string") {
        this.manager = new YDocSyncManager(
          this.identifier,
          sessionStore.user.matrixClient,
          sessionStore.user.type === "matrix-user"
            ? sessionStore.user.userId
            : undefined,
          forkSourceIdentifier
        );
        this.manager.initialize();
      }
    });
  }

  protected constructor(
    public readonly identifier: Identifier,
    forkSourceIdentifier?: Identifier
  ) {
    super();

    // add "manager" to satisfy TS as it's a private field
    // https://mobx.js.org/observable-state.html#limitations
    makeObservable<DocConnection, "manager">(this, {
      doc: computed,
      tryDoc: computed,
      needsFork: computed,
      manager: observable.ref,
    });

    let forked = false;
    const dispose = reaction(
      () => sessionStore.user,
      () => {
        this.clearAndInitializeManager(
          forked ? undefined : forkSourceIdentifier
        );
        forked = true;
      },
      { fireImmediately: true }
    );

    this._register({
      dispose,
    });
  }
  /**
   * Returns the doc if loaded and available, or undefined otherwise
   *
   * (mobx computed)
   *
   * @readonly
   * @memberof DocConnection
   */
  public get tryDoc() {
    return typeof this.doc === "string" ? undefined : this.doc;
  }

  /** @internal */
  public get webrtcProvider() {
    return this.manager?.webrtcProvider;
  }

  public get needsFork() {
    if (!this.manager) {
      return false;
    }
    return !this.manager.canWrite;
  }

  /**
   * Get the managed "doc". Returns:
   * - a BaseResource encapsulating the loaded doc if available
   * - "not-found" if the document doesn't exist locally / remote
   * - "loading" if we're still loading the document
   *
   * (mobx observable)
   *
   * @type {("loading" | "not-found" | BaseResource)}
   * @memberof DocConnection
   */
  public get doc() {
    if (!this.manager) {
      return "loading" as "loading";
    }

    const ydoc = this.manager.doc;
    if (typeof ydoc === "string") {
      return ydoc;
    }

    if (!this._baseResource) {
      this._baseResource = new BaseResource(ydoc, this);
    }

    return this._baseResource;
  }

  public async revert() {
    const manager = this.manager;
    if (!manager) {
      throw new Error("revert() called without manager");
    }
    await manager.deleteLocalChanges();
    this.clearAndInitializeManager();
  }

  public async fork() {
    if (!sessionStore.loggedInUser) {
      throw new Error("not logged in");
    }

    let tryN = 1;

    do {
      if (this.identifier.type !== "typecell") {
        throw new Error("not implemented");
      }
      const newIdentifier = parseTypeCellIdentifier({
        owner: sessionStore.loggedInUser,
        document: this.identifier.document + (tryN > 1 ? "-" + tryN : ""),
      });
      const result = await DocConnection.create(newIdentifier, this.identifier);

      // TODO: store fork info in document

      if (result === "invalid-identifier") {
        throw new Error("unexpected invalid-identifier when forking");
      }

      if (result !== "already-exists") {
        if (result instanceof BaseResource) {
        }
        return result;
      }
      tryN++;
    } while (true);
  }

  public async waitForDoc() {
    await when(() => !!this.tryDoc);
    const doc = this.tryDoc;
    if (!doc) {
      throw new Error(
        "unexpected, doc not available after waiting in waitForDoc"
      );
    }
    return doc;
  }

  // public async reinitialize() {
  //   console.log("reinitialize", this.identifier.id);
  //   runInAction(() => {
  //     this.doc = "loading";
  //   });
  //   this.manager.dispose();
  //   await this.initializeNoCatch();
  // }

  public static async create(
    id: string | { owner: string; document: string },
    forkSourceIdentifier?: Identifier
  ) {
    if (!sessionStore.loggedInUser) {
      throw new Error("no user available on create document");
    }
    const identifier = tryParseTypeCellIdentifier(id);

    if (typeof identifier === "string") {
      return identifier;
    }

    if (identifier.owner !== sessionStore.loggedInUser) {
      throw new Error("not authorized to create this document");
    }

    if (
      await existsLocally(
        getIDBIdentifier(identifier.id, sessionStore.loggedInUser)
      )
    ) {
      return "already-exists";
    }

    const remoteResult = await createMatrixDocument(
      MatrixClientPeg.get(),
      identifier.owner,
      identifier.id,
      "public-read"
    );

    if (remoteResult === "already-exists") {
      return remoteResult;
    }

    if (remoteResult === "offline" || remoteResult.status === "ok") {
      // TODO: add to pending if "offline"
      if (remoteResult === "offline") {
        // create local-first
      }
      const connection = await DocConnection.load(id, forkSourceIdentifier);
      return connection.waitForDoc();
    }

    return remoteResult;
  }

  public static load(
    id: string | { owner: string; document: string } | Identifier,
    forkSourceIdentifier?: Identifier
  ) {
    // TODO
    const identifier = (id as any).type
      ? (id as Identifier)
      : parseTypeCellIdentifier(
          id as string | { owner: string; document: string }
        );

    let connection = cache.get(identifier.id);
    if (!connection) {
      connection = new DocConnection(identifier, forkSourceIdentifier);
      cache.set(identifier.id, connection);
    }
    connection.addRef();
    return connection;
  }

  // TODO: DELETE

  public addRef() {
    this._refCount++;
  }

  public dispose() {
    if (this._refCount === 0 || this.disposed) {
      throw new Error("already disposed or invalid refcount");
    }
    this._refCount--;
    console.log("dispose", this.identifier.id, this._refCount);
    if (this._refCount === 0) {
      super.dispose();

      this._baseResource = undefined;
      this.manager?.dispose();
      this.manager = undefined;
      cache.delete(this.identifier.id);
      this.disposed = true;
    }
  }
}
