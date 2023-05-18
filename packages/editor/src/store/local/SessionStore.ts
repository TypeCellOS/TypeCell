import { computed, makeObservable } from "mobx";
import { lifecycle } from "vscode-lib";
import { Identifier } from "../../identifiers/Identifier";
import { AliasCoordinator } from "../yjs-sync/AliasCoordinator";
import { DocumentCoordinator } from "../yjs-sync/DocumentCoordinator";

/**
 * The sessionStore keeps track of user related data
 * (e.g.: is the user logged in, what is the user name, etc)
 */
export abstract class SessionStore extends lifecycle.Disposable {
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

  constructor() {
    super();
    makeObservable(this, {
      coordinators: computed,
      documentCoordinator: computed,
      aliasCoordinator: computed,
    });
  }

  public get userPrefix() {
    return typeof this.user === "string"
      ? undefined
      : this.user.type === "guest-user"
      ? `user-${this.storePrefix}-guest`
      : `user-${this.storePrefix}-${this.user.fullUserId}`;
  }

  private _coordinators:
    | {
        userPrefix: string;
        coordinator: DocumentCoordinator;
        aliasStore: AliasCoordinator;
      }
    | undefined;

  public get coordinators() {
    if (
      this._coordinators &&
      this._coordinators.userPrefix === this.userPrefix
    ) {
      return this._coordinators;
    }

    console.log("dispose");
    this._coordinators?.coordinator.dispose();
    this._coordinators?.aliasStore.dispose();

    if (!this.userPrefix) {
      return undefined;
    }

    this._coordinators = {
      userPrefix: this.userPrefix,
      coordinator: new DocumentCoordinator(this.userPrefix),
      aliasStore: new AliasCoordinator(this.userPrefix),
    };
    return this._coordinators;
  }

  public get documentCoordinator() {
    return this.coordinators?.coordinator;
  }

  public get aliasCoordinator() {
    return this.coordinators?.aliasStore;
  }
}
