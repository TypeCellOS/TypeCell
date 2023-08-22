import {
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";
import { lifecycle } from "vscode-lib";
import { Identifier } from "../../identifiers/Identifier";
import { BackgroundSyncer } from "../BackgroundSyncer";
import { DocConnection } from "../DocConnection";
import ProfileResource from "../ProfileResource";
import { AliasCoordinator } from "../yjs-sync/AliasCoordinator";
import { DocumentCoordinator } from "../yjs-sync/DocumentCoordinator";

/**
 * The sessionStore keeps track of user related data
 * (e.g.: is the user logged in, what is the user name, etc)
 */
export abstract class SessionStore extends lifecycle.Disposable {
  public profileDoc: DocConnection | undefined = undefined;
  public get profile() {
    return this.profileDoc?.tryDoc?.getSpecificType(ProfileResource);
  }

  public abstract storePrefix: string;

  public abstract userColor: string;

  // MUST be implemented as Observable
  public abstract user:
    | "loading"
    | "offlineNoUser"
    | {
        type: "guest-user";
      }
    | {
        type: "user";
        fullUserId: string;
        userId: string;
        profileId: string;
        isSignUp: boolean;
      };

  /**
   * returns a logged in user or a guest user when available
   * otherwise undefined
   */
  public get tryUser() {
    return typeof this.user === "string" ? undefined : this.user;
  }

  /**
   * returns true if the user is logged in to his / her own identity.
   * returns false if only a guest user or no user is available.
   *
   * MUST be implemented as Observable (computed)
   */
  public abstract get isLoggedIn(): boolean;

  public abstract get isLoaded(): boolean;

  /**
   * Returns the userId (e.g.: @bret) when logged in, undefined otherwise
   */
  public abstract get loggedInUserId(): string | undefined;

  public abstract logout: () => Promise<void>;

  public abstract initialize(): Promise<void>;

  public abstract getIdentifierForNewDocument(): Identifier;

  constructor(private loadProfile = true) {
    super();
    makeObservable(this, {
      documentCoordinator: computed,
      aliasCoordinator: computed,
      userPrefix: computed,
      coordinators: observable.ref,
      profileDoc: observable.ref,
      profile: computed,
    });
  }

  protected initializeReactions() {
    const dispose = reaction(
      () => this.userPrefix,
      () => {
        // console.log(new Date(), "change coordinators", this.userPrefix, "\n\n");
        const userPrefix = this.userPrefix;
        if (this.coordinators?.userPrefix === userPrefix) {
          return;
        }

        this.coordinators?.coordinator.dispose();
        this.coordinators?.aliasStore.dispose();
        this.coordinators?.backgroundSyncer?.dispose();
        runInAction(() => {
          this.coordinators = undefined;
          this.profileDoc?.dispose();
          this.profileDoc = undefined;
        });

        if (!userPrefix) {
          return;
        }

        (async () => {
          const user = this.user;
          const coordinator = new DocumentCoordinator(userPrefix);
          const coordinators = {
            userPrefix,
            coordinator: coordinator,
            aliasStore: new AliasCoordinator(userPrefix),
            backgroundSyncer:
              typeof user !== "string" && user.type !== "guest-user"
                ? new BackgroundSyncer(coordinator, this)
                : undefined,
          };
          await coordinators.coordinator.initialize();

          if (typeof user !== "string" && user.type === "user" && user.isSignUp) {
            await coordinators.coordinator.copyFromGuest();
          }

          await coordinators.aliasStore.initialize();
          await coordinators.backgroundSyncer?.initialize();
          runInAction(() => {
            if (this.userPrefix === userPrefix) {
              // console.log("set coordinators", userPrefix);
              this.coordinators = coordinators;
              if (typeof user !== "string" && user.type === "user") {
                this.profileDoc = this.loadProfile
                  ? DocConnection.load(user.profileId, this)
                  : undefined;
              }
            }
          });
        })();
      },
      { fireImmediately: true }
    );

    this._register({
      dispose,
    });
  }

  public get userPrefix() {
    return typeof this.user === "string"
      ? undefined
      : this.user.type === "guest-user"
      ? `user-${this.storePrefix}-guest`
      : `user-${this.storePrefix}-${this.user.fullUserId}`;
  }

  public coordinators:
    | {
        userPrefix: string;
        coordinator: DocumentCoordinator;
        aliasStore: AliasCoordinator;
        backgroundSyncer?: BackgroundSyncer;
      }
    | undefined = undefined;

  public get documentCoordinator() {
    return this.coordinators?.coordinator;
  }

  public get aliasCoordinator() {
    return this.coordinators?.aliasStore;
  }
}
