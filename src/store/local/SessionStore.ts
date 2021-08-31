import { createClient, MatrixClient } from "matrix-js-sdk";
import {
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";

import { MATRIX_CONFIG } from "../../config/config";
import { MatrixAuthStore } from "../../matrix-auth/MatrixAuthStore";
import { MatrixClientPeg } from "../../matrix-auth/MatrixClientPeg";
import { createMatrixGuestClient } from "../../matrix-yjs/MatrixGuestClient";

export class SessionStore {
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
    return this.matrixAuthStore.loggedInUser;
  }
  public logout = this.matrixAuthStore.logout;
  public matrixClient: MatrixClient;

  constructor(private matrixAuthStore: MatrixAuthStore) {
    makeObservable(this, {
      user: observable.ref,
      matrixClient: observable.ref,
      isLoggedIn: computed,
    });
  }

  public async initialize() {
    await this.matrixAuthStore.initialize(
      MATRIX_CONFIG.defaultDeviceDisplayName
    );

    reaction(
      () => this.matrixAuthStore.loggedInUser,
      () => {
        this.updateStateFromAuthStore().catch((e) => {
          console.error("error initializing sessionstore", e);
        });
      },
      { fireImmediately: true }
    );
  }

  private async updateStateFromAuthStore() {
    if (this.matrixAuthStore.loggedInUser) {
      // signed in as a real user
      const userId = this.matrixAuthStore.loggedInUser;
      runInAction(() => {
        this.user = {
          type: "matrix-user",
          matrixClient: MatrixClientPeg.get(),
          userId,
        };
      });
      return;
    }

    // TODO: don't register as guest on home page, when no matrix is needed
    try {
      const config = {
        baseUrl: MATRIX_CONFIG.hsUrl,
        // idBaseUrl: "https://vector.im",
      };

      const matrixClient = await createMatrixGuestClient(config);

      runInAction(() => {
        this.user = {
          type: "guest-user",
          matrixClient,
        };
      });
    } catch (e) {
      runInAction(() => {
        this.user = "offlineNoUser";
      });
    }
  }
}
