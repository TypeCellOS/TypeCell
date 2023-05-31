import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import {
  computed,
  createAtom,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import { uuid } from "vscode-lib";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { SupabaseSessionStore } from "../../../app/supabase-auth/SupabaseSessionStore";
import { TypeCellIdentifier } from "../../../identifiers/TypeCellIdentifier";
import { Remote } from "./Remote";

let wsProviders = new Map<string, HocuspocusProviderWebsocket | undefined>();

function toHex(arr: Uint8Array) {
  return [...arr].map((x) => x.toString(16).padStart(2, "0") as any).join("");
}

function getWSProvider(session: SupabaseSessionStore) {
  if (!session.userId) {
    throw new Error("no user available on create document");
  }
  let wsProvider = wsProviders.get(session.userId);
  if (!wsProvider) {
    console.log("new ws provider");
    wsProvider = new HocuspocusProviderWebsocket({
      url: "ws://localhost:1234",
      // WebSocketPolyfill: ws,
      onConnect() {
        console.log("connected");
      },
    });
    if (TypeCellRemote.Offline) {
      wsProvider.disconnect();
    }
    wsProviders.set(session.userId, wsProvider);
  }
  return wsProvider;
}

export class TypeCellRemote extends Remote {
  protected id: string = "typecell";

  private hocuspocusProvider: HocuspocusProvider | undefined;
  private _awarenessAtom = createAtom("_awarenessAtom");
  private _canWriteAtom = createAtom("_canWrite");
  private disposed = false;

  public unsyncedChanges = 0;

  // TODO: set to true and run tests
  private static _offline = false;

  public static get Offline() {
    return this._offline;
  }

  public static set Offline(val: boolean) {
    if (val) {
      wsProviders.forEach((wsProvider) => {
        wsProvider?.disconnect();
      });
    } else {
      wsProviders.forEach((wsProvider) => {
        wsProvider?.connect();
      });
    }
    this._offline = val;
  }

  constructor(
    _ydoc: Y.Doc,
    private readonly identifier: TypeCellIdentifier,
    private readonly sessionStore: SupabaseSessionStore
  ) {
    super(_ydoc);
    if (!(identifier instanceof TypeCellIdentifier)) {
      throw new Error("invalid identifier");
    }
    makeObservable(this, {
      unsyncedChanges: observable.ref,
      canWrite: computed,
    });
  }

  public get awareness(): awarenessProtocol.Awareness | undefined {
    this._awarenessAtom.reportObserved();
    return this.hocuspocusProvider?.awareness;
  }

  public get canWrite() {
    return this.unsyncedChanges === 0;
    // this._canWriteAtom.reportObserved();
    // if (!this.hocuspocusProvider) {
    //   return true;
    // }
    // return true;
    // // TODO
    // // return this.hocuspocusProvider.canWrite;
  }

  public get canCreate() {
    return true;
  }

  public async create() {
    const sessionStore = this.sessionStore;

    if (!sessionStore.userId) {
      throw new Error("no user available on create document");
    }

    if (!sessionStore.loggedInUserId) {
      console.warn("no loggedInUserId available on create document");
    }

    const date = JSON.stringify(new Date());
    const data = Y.encodeStateAsUpdate(this._ydoc);
    const doc = {
      id: uuid.generateUuid(),
      created_at: date,
      updated_at: date,
      data: "\\x" + toHex(data),
      nano_id: this.identifier.documentId,
      public_access_level: this.identifier.documentId.endsWith("/.inbox")
        ? "write"
        : "read", // TODO: shouldn't be hardcoded here
      user_id: sessionStore.userId,
    } as const;

    if (TypeCellRemote.Offline) {
      throw new Error("offline");
    }
    console.log(
      "insert doc",
      (await sessionStore.supabase.auth.getSession()).data.session?.user.id,
      doc
    );
    const ret = await sessionStore.supabase
      .from("documents")
      .insert(doc)
      .select();

    if (ret.error) {
      console.error(ret.error);
      return "error";
    }
    // TODO: already exists
    return "ok";
  }

  public async startSyncing() {
    if (this.disposed) {
      console.warn("already disposed");
      return;
    }

    const user = this.sessionStore.user;
    if (typeof user === "string") {
      throw new Error("no user");
    }

    const session = (await this.sessionStore.supabase.auth.getSession()).data
      .session;
    const token = session
      ? session.access_token + "$" + session.refresh_token
      : "guest";

    if (this.disposed) {
      console.warn("already disposed");
      return;
    }

    console.log("token", token);
    const hocuspocusProvider = new HocuspocusProvider({
      name: this.identifier.documentId,
      document: this._ydoc,
      token,
      websocketProvider: getWSProvider(this.sessionStore),
      broadcast: false,

      onSynced: () => {
        runInAction(() => {
          this.unsyncedChanges = hocuspocusProvider.unsyncedChanges;
          this.status = "loaded";
        });
      },
      onAuthenticationFailed: (data) => {
        runInAction(() => {
          console.warn("auth failed", data);
          this.status = "not-found";
        });
      },
    });
    (hocuspocusProvider as any).isRemote = true;

    hocuspocusProvider.on("unsyncedChanges", () => {
      runInAction(() => {
        this.unsyncedChanges = hocuspocusProvider.unsyncedChanges;
      });
    });
    this.unsyncedChanges = hocuspocusProvider.unsyncedChanges;

    this.hocuspocusProvider = hocuspocusProvider;

    this._register({
      dispose: () => hocuspocusProvider.destroy(),
    });

    this._awarenessAtom.reportChanged();
    this._canWriteAtom.reportChanged();
    // this.hocuspocusProvider?.on("");
  }
  //   `this._register(
  //     this.matrixProvider.onCanWriteChanged(() => {
  //       this._canWriteAtom.reportChanged();
  //     })
  //   );

  //   this._register(
  //     this.matrixProvider.onDocumentAvailable(() => {
  //       console.log("doc available");
  //       runInAction(() => {
  //         this.status = "loaded";
  //       });
  //     })
  //   );

  //   this._register(
  //     this.matrixProvider.onDocumentUnavailable(() => {
  //       runInAction(() => {
  //         this.status = "not-found";
  //       });
  //     })
  //   );
  // }`

  public dispose(): void {
    this.disposed = true;
    super.dispose();
  }
}
