import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { createAtom, runInAction } from "mobx";
import { uuid } from "vscode-lib";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { SupabaseSessionStore } from "../../../app/supabase-auth/SupabaseSessionStore";
import { TypeCellIdentifier } from "../../../identifiers/TypeCellIdentifier";
import { getStoreService } from "../../local/stores";
import { Remote } from "./Remote";
const wsProvider = new HocuspocusProviderWebsocket({
  url: "ws://localhost:1234",
  // WebSocketPolyfill: ws,
});

export class TypeCellRemote extends Remote {
  protected id: string = "typecell";

  public hocuspocusProvider: HocuspocusProvider | undefined;
  private _canWriteAtom = createAtom("_canWrite");
  private disposed = false;

  constructor(
    _ydoc: Y.Doc,
    awareness: awarenessProtocol.Awareness,
    private readonly identifier: TypeCellIdentifier
  ) {
    super(_ydoc, awareness);
    if (!(identifier instanceof TypeCellIdentifier)) {
      throw new Error("invalid identifier");
    }
  }

  public get canWrite() {
    this._canWriteAtom.reportObserved();
    if (!this.hocuspocusProvider) {
      return true;
    }
    return true;
    // return this.supabaseProvider.canWrite;
  }

  public get canCreate() {
    return true;
  }

  public async create() {
    const sessionStore = getStoreService().sessionStore;

    if (!(sessionStore instanceof SupabaseSessionStore)) {
      throw new Error("invalid sessionStore (expected SupabaseSessionStore)");
    }

    if (!sessionStore.loggedInUserId) {
      throw new Error("no user available on create document");
    }

    const date = JSON.stringify(new Date());
    const doc = {
      id: uuid.generateUuid(),
      created_at: date,
      updated_at: date,
      data: "",
      nano_id: this.identifier.documentId,
      public_access_level: "no-access",
      user_id: sessionStore.userId,
    } as const;

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

  public async load() {
    if (this.disposed) {
      console.warn("already disposed");
      return;
    }
    const sessionStore = getStoreService().sessionStore;
    if (!(sessionStore instanceof SupabaseSessionStore)) {
      throw new Error("invalid sessionStore (expected MatrixSessionStore)");
    }

    const user = sessionStore.user;
    if (typeof user === "string") {
      throw new Error("no user");
    }
    console.log("matrix listen");

    const session = (await sessionStore.supabase.auth.getSession()).data
      .session;
    if (!session) {
      throw new Error("no session");
    }
    const hocuspocusProvider = new HocuspocusProvider({
      name: this.identifier.documentId,
      document: this._ydoc,
      token: session.access_token + "$" + session.refresh_token,
      websocketProvider: wsProvider,
      broadcast: false,
      onSynced: () => {
        runInAction(() => {
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

    this._register({
      dispose: () => hocuspocusProvider.destroy,
    });

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
