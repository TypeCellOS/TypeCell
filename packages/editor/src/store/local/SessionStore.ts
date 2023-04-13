import { lifecycle } from "vscode-lib";

/**
 * The sessionStore keeps track of user related data
 * (e.g.: is the user logged in, what is the user name, etc)
 */
export abstract class SessionStore extends lifecycle.Disposable {
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
}
