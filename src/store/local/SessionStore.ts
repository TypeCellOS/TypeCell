import { createClient, MatrixClient } from "matrix-js-sdk";
import {
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";
import { MatrixAuthStore } from "../../matrix-auth/MatrixAuthStore";
import { MatrixClientPeg } from "../../matrix-auth/MatrixClientPeg";

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
    await this.matrixAuthStore.loadSession();
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
        baseUrl: "https://mx.typecell.org",
        // idBaseUrl: "https://vector.im",
      };
      const tmpClient = await createClient(config);
      const { user_id, device_id, access_token } =
        await tmpClient.registerGuest();
      let matrixClient = createClient({
        baseUrl: config.baseUrl,
        accessToken: access_token,
        userId: user_id,
        deviceId: device_id,
      });
      matrixClient._supportsVoip = false;
      matrixClient._clientOpts = {
        lazyLoadMembers: false,
      };
      matrixClient.setGuest(true);
      // don't use startClient (because it will sync periodically), when we're in guest / readonly mode
      // in guest mode we only use the matrixclient to fetch initial room state, but receive updates via WebRTCProvider

      // matrixClient.startClient({ lazyLoadMembers: true });
      runInAction(() => {
        this.user = {
          type: "guest-user",
          matrixClient,
        };
      });
    } catch (e) {
      console.error(e);
      runInAction(() => {
        this.user = "offlineNoUser";
      });
    }
  }
}
