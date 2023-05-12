import { computed, makeObservable, observable, runInAction } from "mobx";
import { arrays, uri } from "vscode-lib";
import { SessionStore } from "../../store/local/SessionStore";
// @ts-ignore
import { createClient } from "@supabase/supabase-js";

import { ANON_KEY } from "./supabaseConfig";

import { uniqueId } from "@typecell-org/common";

import type { Database } from "../../../../../packages/server/src/types/schema";
import { Identifier } from "../../identifiers/Identifier";
import { TypeCellIdentifier } from "../../identifiers/TypeCellIdentifier";
import { navigateRef } from "../GlobalNavigateRef";

export type SupabaseClientType = SupabaseSessionStore["supabase"];

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
export class SupabaseSessionStore extends SessionStore {
  public readonly supabase = createClient<Database>(
    "http://localhost:54321",
    ANON_KEY
  );

  private initialized = false;
  public userId: string | undefined = undefined;

  public userColor = arrays.getRandomElement(colors)!;

  public user:
    | "loading"
    | "offlineNoUser"
    | {
        type: "guest-user";
        supabase: any;
      }
    | {
        type: "user";
        fullUserId: string;
        userId: string;
        supabase: any;
      } = "loading";

  public get isLoaded() {
    return this.user !== "loading" || typeof this.userId === "string";
  }
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
    await this.supabase.auth.signOut();
  };

  public getIdentifierForNewDocument(): Identifier {
    return new TypeCellIdentifier(
      uri.URI.from({
        scheme: "typecell",
        authority: "typecell.org",
        path: "/" + uniqueId.generateId("document"),
      })
    );
  }

  constructor() {
    super();
    makeObservable(this, {
      user: observable.ref,
      userId: observable.ref,
      isLoggedIn: computed,
      isLoaded: computed,
    });
  }

  public async initialize() {
    if (this.initialized) {
      throw new Error("initialize() called when already initialized");
    }
    this.initialized = true;

    try {
      this._register({
        dispose: this.supabase.auth.onAuthStateChange((event, session) => {
          this.updateStateFromAuthStore().catch((e) => {
            console.error("error initializing sessionstore", e);
          });
        }).data.subscription.unsubscribe,
      });
      this.updateStateFromAuthStore();
    } catch (err) {
      // keep state as "loading"
      console.error("error loading session from supabase", err);
    }
  }

  public async setUsername(username: string) {
    if (!this.userId) {
      throw new Error("can't set username when not logged in");
    }

    // TODO: manage aliases
    // const profileIdentifier = this.getIdentifierForNewDocument();
    // const ret = DocConnection.create();

    const { data, error } = await this.supabase.from("workspaces").insert([
      {
        name: username,
        owner_user_id: this.userId,
        is_username: true,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }

    await this.updateStateFromAuthStore();
  }
  /**
   * Updates the state of sessionStore based on the internal matrixAuthStore.loggedIn
   */
  private async updateStateFromAuthStore() {
    // TODO: don't trigger on refresh of other browser window
    const session = (await this.supabase.auth.getSession()).data.session;
    // TODO: check errors?

    if (session) {
      const usernameRes = await this.supabase
        .from("workspaces")
        .select()
        .eq("owner_user_id", session?.user.id)
        .eq("is_username", true);

      if (usernameRes.data?.length === 1) {
        const username: string = usernameRes.data[0].name;

        runInAction(() => {
          this.userId = session.user.id;
          this.user = {
            type: "user",
            supabase: this.supabase,
            userId: username,
            fullUserId: username,
          };
        });
      } else {
        if (!navigateRef) {
          throw new Error("no global navigateRef");
        }
        runInAction(() => {
          this.userId = session.user.id;
        });
        console.log("redirect");
        navigateRef.current?.("/username");
        // runInAction(() => {
        //   this.user = {
        //     type: "user",
        //     supabase: this.supabase,
        //     userId: "username",
        //     fullUserId: "username",
        //   };
        // });
      }
    } else {
      runInAction(() => {
        this.user = {
          type: "guest-user",
          supabase: this.supabase,
        };
      });
    }
  }
}
