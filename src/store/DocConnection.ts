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

import { sessionStore } from "./local/stores";
import { existsLocally, getIDBIdentifier } from "./yjs-sync/IDBHelper";
import { YDocFileSyncManager } from "./yjs-sync/YDocFileSyncManager";
import { YDocSyncManager } from "./yjs-sync/YDocSyncManager";
import * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import { FileIdentifier } from "../identifiers/FileIdentifier";
import { GithubIdentifier } from "../identifiers/GithubIdentifier";
import { MatrixIdentifier } from "../identifiers/MatrixIdentifier";
import { URI } from "../util/vscode-common/uri";
import { parseIdentifier, tryParseIdentifier } from "../identifiers";

const cache = new Map<string, DocConnection>();

/**
 * Encapsulates a Y.Doc and exposes the Resource the Y.Doc represents
 */
export class DocConnection extends Disposable {
  private disposed: boolean = false;
  private _refCount = 0;

  /** @internal */
  private manager: YDocSyncManager | YDocFileSyncManager | undefined;
  private _baseResourceCache:
    | undefined
    | {
        baseResource: BaseResource;
        doc: Y.Doc;
      };

  // TODO: move to YDocSyncManager?
  private clearAndInitializeManager(forkSourceIdentifier?: Identifier) {
    runInAction(() => {
      this._baseResourceCache = undefined;
      this.manager?.dispose();
      this.manager = undefined;
      if (this.identifier instanceof FileIdentifier) {
        this.manager = new YDocFileSyncManager(this.identifier);
        this.manager.initialize();
      } else if (
        this.identifier instanceof GithubIdentifier ||
        this.identifier instanceof MatrixIdentifier
      ) {
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
      } else {
        throw new Error("unsupported identifier");
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

    if (!this._baseResourceCache || this._baseResourceCache.doc !== ydoc) {
      this._baseResourceCache = {
        doc: ydoc,
        baseResource: new BaseResource(ydoc, this),
      };
    }

    return this._baseResourceCache.baseResource;
  }

  public async revert() {
    if (this.manager instanceof YDocFileSyncManager) {
      throw new Error("revert() not supported for YDocFileSyncManager");
    }
    const manager = this.manager;
    if (!manager) {
      throw new Error("revert() called without manager");
    }
    await manager.deleteLocalChanges();
    this.clearAndInitializeManager();
  }

  // TODO: fork github or file sources
  public async fork() {
    if (!sessionStore.loggedInUser) {
      throw new Error("not logged in");
    }

    let tryN = 1;

    do {
      if (!(this.identifier instanceof MatrixIdentifier)) {
        throw new Error("not implemented");
      }
      // TODO: test
      const newIdentifier = new MatrixIdentifier(
        URI.from({
          scheme: this.identifier.uri.scheme,
          // TODO: use user authority,
          path:
            "@" +
            sessionStore.loggedInUser +
            " / " +
            this.identifier.document +
            (tryN > 1 ? "-" + tryN : ""),
        })
      );

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
    const identifier = tryParseIdentifier(id);

    if (identifier === "invalid-identifier") {
      return identifier;
    }

    if (!(identifier instanceof MatrixIdentifier)) {
      throw new Error("invalid identifier");
    }

    // TODO: check authority
    if (identifier.owner !== sessionStore.loggedInUser) {
      throw new Error("not authorized to create this document");
    }

    if (
      await existsLocally(
        getIDBIdentifier(identifier.toString(), sessionStore.loggedInUser)
      )
    ) {
      return "already-exists";
    }

    const remoteResult = await createMatrixDocument(
      MatrixClientPeg.get(),
      identifier.owner,
      identifier.roomName,
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
    identifier: string | { owner: string; document: string } | Identifier,
    forkSourceIdentifier?: Identifier
  ) {
    // TODO
    if (!(identifier instanceof Identifier)) {
      identifier = parseIdentifier(identifier);
    }

    let connection = cache.get(identifier.toString());
    if (!connection) {
      connection = new DocConnection(identifier, forkSourceIdentifier);
      cache.set(identifier.toString(), connection);
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
    console.log("dispose", this.identifier.toString(), this._refCount);
    if (this._refCount === 0) {
      super.dispose();

      this._baseResourceCache = undefined;
      this.manager?.dispose();
      this.manager = undefined;
      cache.delete(this.identifier.toString());
      this.disposed = true;
    }
  }
}
