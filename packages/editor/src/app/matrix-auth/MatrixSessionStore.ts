import { MatrixClient } from "matrix-js-sdk";
import { computed, makeObservable, observable, runInAction } from "mobx";
import { arrays, uri } from "vscode-lib";
import { SessionStore } from "../../store/local/SessionStore";
import { MatrixAuthStore } from "./MatrixAuthStore";
import { MatrixClientPeg } from "./MatrixClientPeg";
import { getUserFromMatrixId } from "./matrixUserIds";
// @ts-ignore
import { uniqueId } from "@typecell-org/common";
import { DEFAULT_HOMESERVER_URI } from "../../config/config";
import { Identifier } from "../../identifiers/Identifier";
import { MatrixIdentifier } from "../../identifiers/MatrixIdentifier";
import { DocumentCoordinator } from "../../store/yjs-sync/DocumentCoordinator";

const colors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];

/**
 * The sessionStore keeps track of user related data
 * (e.g.: is the user logged in, what is the user name, etc)
 */
export class MatrixSessionStore extends SessionStore {
  public storePrefix: string = "mx";
  private initialized = false;
  public userColor = arrays.getRandomElement(colors)!;

  public user:
    | "loading"
    | "offlineNoUser"
    | {
        type: "guest-user";
        matrixClient: MatrixClient;
        coordinator: DocumentCoordinator;
      }
    | {
        type: "user";
        fullUserId: string;
        userId: string;
        matrixClient: MatrixClient;
        coordinator: DocumentCoordinator;
      } = "loading";

  /**
   * returns true if the user is logged in to his own matrix identity.
   * returns false if only a guest user or no user is available.
   *
   * Note that this definition of loggedin is different than in the Matrix-related code,
   * in Matrix code (e.g. MatrixAuthStore.loggedIn), a guest user is also considered logged in ("logged in as guest")
   */
  public get isLoggedIn() {
    return typeof this.user !== "string" && this.user.type === "user";
  }

  public get isLoaded() {
    return this.user !== "loading";
  }

  /**
   * Returns the userId (e.g.: @bret) when logged in, undefined otherwise
   */
  public get loggedInUserId() {
    return typeof this.user !== "string" && this.user.type === "user"
      ? this.user.userId
      : undefined;
  }

  public logout = async () => {
    if (!this.isLoggedIn) {
      throw new Error("can't logout when not logged in");
    }
    await this.matrixAuthStore.logout();

    // after logging out, call initialize() to sign in as a guest
    await this.matrixAuthStore.initialize(true);
  };

  constructor(public readonly matrixAuthStore: MatrixAuthStore) {
    super();
    makeObservable(this, {
      user: observable.ref,
      isLoggedIn: computed,
    });
  }

  public getIdentifierForNewDocument(): Identifier {
    return new MatrixIdentifier(
      uri.URI.from({
        scheme: "mx",
        authority: DEFAULT_HOMESERVER_URI.authority,
        path: "/" + uniqueId.generateId("document"),
      })
    );
  }

  // TODO: should be a reaction to prevent calling twice?
  public async enableGuest() {
    if (!this.initialized) {
      throw new Error(
        "enableGuest should only be called after being initialized"
      );
    }

    if (this.user === "offlineNoUser") {
      await this.matrixAuthStore.initialize(true);
    }
  }

  public async initialize() {
    if (this.initialized) {
      throw new Error("initialize() called when already initialized");
    }
    this.initialized = true;

    try {
      const Olm = await import("@matrix-org/olm");
      const olmWasmPath = await import("@matrix-org/olm/olm.wasm?url");
      await Olm.init({
        locateFile: () => olmWasmPath,
      });

      // returns true when:
      // - successfully created / restored a user (or guest)
      // returns false when:
      // - failed restore / create user (e.g.: wanted to register a guest, but offline)
      // throws error when:
      // - unexpected
      await this.matrixAuthStore.initialize(false);
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

  /**
   * Updates the state of sessionStore based on the internal matrixAuthStore.loggedIn
   */
  private async updateStateFromAuthStore() {
    if (this.matrixAuthStore.loggedIn) {
      const matrixClient = MatrixClientPeg.get();

      if (matrixClient.isGuestAccount) {
        runInAction(() => {
          this.user = {
            type: "guest-user",
            matrixClient,
            coordinator: new DocumentCoordinator("user-mx-guest"),
          };
        });
      } else {
        // signed in as a real user
        runInAction(() => {
          this.user = {
            type: "user",
            matrixClient,
            userId: getUserFromMatrixId(matrixClient.getUserId() as string)
              .localUserId,
            fullUserId: matrixClient.getUserId(), // TODO: nicer to remove make userId represent the full matrix id instead of having a separate property
            coordinator: new DocumentCoordinator(
              "user-mx-" + matrixClient.getUserId()
            ),
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
