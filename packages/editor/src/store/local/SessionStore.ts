import { MatrixClient } from "matrix-js-sdk";
import { computed, makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
import { MatrixAuthStore } from "../../app/matrix-auth/MatrixAuthStore";
import { MatrixClientPeg } from "../../app/matrix-auth/MatrixClientPeg";

function getUserFromMatrixId(matrixId: string) {
  const parts = matrixId.split(":");
  if (parts.length !== 2) {
    throw new Error("invalid user id");
  }
  const [user /*_host*/] = parts; // TODO: think out host for federation
  if (!user.startsWith("@") || user.length < 2) {
    throw new Error("invalid user id");
  }

  return user;
}
export class SessionStore extends lifecycle.Disposable {
  public user:
    | "loading"
    | "offlineNoUser"
    | {
        type: "guest-user";
        matrixClient: MatrixClient;
      }
    | {
        type: "matrix-user";
        userId: string;
        matrixClient: MatrixClient;
      } = "loading";

  public get tryUser() {
    return typeof this.user === "string" ? undefined : this.user;
  }

  public get isLoggedIn() {
    return typeof this.user !== "string" && this.user.type === "matrix-user";
  }

  public get loggedInUser() {
    return typeof this.user !== "string" && this.user.type === "matrix-user"
      ? this.user.userId
      : undefined;
  }

  public logout = async () => {
    if (!this.isLoggedIn) {
      throw new Error("can't logout when not logged in");
    }
    await this.matrixAuthStore.logout();

    // after logging out, call initialize() to sign in as a guest
    await this.matrixAuthStore.initialize();
  };
  public matrixClient: MatrixClient;

  constructor(private matrixAuthStore: MatrixAuthStore) {
    super();
    makeObservable(this, {
      user: observable.ref,
      matrixClient: observable.ref,
      isLoggedIn: computed,
    });
  }

  public async initialize() {
    try {
      // returns true when:
      // - successfully created / restored a user (or guest)
      // returns false when:
      // - failed restore / create user (e.g.: wanted to register a guest, but offline)
      // throws error when:
      // - unexpected
      await this.matrixAuthStore.initialize();

      // catch future login state changes triggered by the sdk
      this._register(
        this.matrixAuthStore.onLoggedInChanged(() => {
          this.updateStateFromAuthStore().catch((e) => {
            console.error("error initializing sessionstore", e);
          });
        })
      );

      this.updateStateFromAuthStore();
    } catch (err) {
      // keep state as "loading"
      console.error("error loading session from matrix", err);
    }
  }

  private async updateStateFromAuthStore() {
    if (this.matrixAuthStore.loggedIn) {
      const matrixClient = MatrixClientPeg.get();

      if (matrixClient.isGuestAccount) {
        runInAction(() => {
          this.user = {
            type: "guest-user",
            matrixClient,
          };
        });
      } else {
        // signed in as a real user
        runInAction(() => {
          this.user = {
            type: "matrix-user",
            matrixClient,
            userId: getUserFromMatrixId(matrixClient.getUserId() as string),
          };
        });
      }
    } else {
      runInAction(() => {
        this.user = "offlineNoUser";
      });
    }
  }
}
