import { createClient, Session } from "@supabase/supabase-js";
import type { Database } from "@typecell-org/shared";
import { uniqueId } from "@typecell-org/util";
import { computed, makeObservable, observable, runInAction } from "mobx";
import { arrays, uri } from "vscode-lib";
import * as Y from "yjs";
import { env } from "../../config/env";
import {
  DefaultShorthandResolver,
  setDefaultShorthandResolver,
} from "../../identifiers/paths/identifierPathHelpers";
import { TypeCellIdentifier } from "../../identifiers/TypeCellIdentifier";
import { BaseResource } from "../../store/BaseResource";
import { SessionStore } from "../../store/local/SessionStore";
import ProfileResource from "../../store/ProfileResource";
import { TypeCellRemote } from "../../store/yjs-sync/remote/TypeCellRemote";
import { navigateRef } from "../GlobalNavigateRef";


export type SupabaseClientType = ReturnType<typeof createClient<Database>>;

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
  public storePrefix = "tc";

  public readonly supabase: SupabaseClientType;

  private initialized = false;
  public userId: string | undefined = undefined;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  public userColor = arrays.getRandomElement(colors)!;

  public user:
    | "loading"
    | "offlineNoUser"
    | {
        type: "guest-user";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: any;
      }
    | {
        type: "user";
        fullUserId: string;
        userId: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase: any;
        profileId: string;
        isSignUp: boolean;
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

  public getIdentifierForNewDocument() {
    return new TypeCellIdentifier(
      uri.URI.from({
        scheme: "typecell",
        authority: "typecell.org",
        path: "/" + uniqueId.generateId("document"),
      })
    );
  }

  constructor(loadProfile = true, persist = true) {
    super(loadProfile);
    makeObservable(this, {
      user: observable.ref,
      userId: observable.ref,
      isLoggedIn: computed,
      isLoaded: computed,
    });
    this.supabase = createClient<Database>(env.VITE_TYPECELL_SUPABASE_URL, env.VITE_TYPECELL_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: persist,
      },
    });
    this.initializeReactions();
  }

  public async initialize() {
    if (this.initialized) {
      throw new Error("initialize() called when already initialized");
    }
    this.initialized = true;

    try {
      const session = (await this.supabase.auth.getSession()).data.session || undefined;
      let previousSessionId = session?.user.id;
      const cbData = this.supabase.auth.onAuthStateChange((event, session) => {


        // only trigger if user id changed
        if (session?.user.id !== previousSessionId) {
          previousSessionId = session?.user.id;
          this.updateStateFromAuthStore(session || undefined).catch((e) => {
            console.error("error initializing sessionstore", e);
          });
        }
      });
      this._register({
        dispose: cbData.data.subscription.unsubscribe,
      });
      this.updateStateFromAuthStore(session);
    } catch (err) {
      // keep state as "loading"
      console.error("error loading session from supabase", err);
    }
  }

  public async setUsername(username: string) {
    if (!this.userId) {
      throw new Error("can't set username when not logged in");
    }

    {
      const { data } = await this.supabase
        .from("workspaces")
        .select()
        .eq("name", username)
        .eq("is_username", true)
        .limit(1);

      if (data) {
        return "not-available";
      }
    }
    const session = (await this.supabase.auth.getSession()).data.session;
    if (!session) {
      throw new Error("unexpected: no session")
    }

    // create workspace
    const workspaceId = this.getIdentifierForNewDocument();
    {
      // TODO: use syncmanager?
      const ydoc = new Y.Doc();
      const ret = new BaseResource(ydoc, workspaceId);
      ret.create("!project");
      ret.title = "Public workspace";
      const remote = new TypeCellRemote(ydoc, workspaceId, this);
      await remote.createAndRetry();
      ret.dispose();
      remote.dispose();
    }


    // create profile
    const profileId = this.getIdentifierForNewDocument();
    {
      // TODO: use syncmanager?
      const ydoc = new Y.Doc();
      const ret = new BaseResource(ydoc, profileId);
      ret.create("!profile");
      const profile = ret.getSpecificType(ProfileResource);
      profile.workspaces.set("public", workspaceId.toString());
      profile.username = username;
      profile.joinedDate = Date.now()

      const avatar = session.user.user_metadata?.avatar_url;

      if (avatar) {
        profile.avatar_url = avatar;
      }

      const remote = new TypeCellRemote(ydoc, profileId, this);
      await remote.createAndRetry();
      ret.dispose();
      remote.dispose();
    }

    const { error } = await this.supabase.from("workspaces").insert([
      {
        name: username,
        owner_user_id: this.userId,
        is_username: true,
        document_nano_id: profileId.documentId,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }


    await this.updateStateFromAuthStore(session, true);
  }
  /**
   * Updates the state of sessionStore based on the internal matrixAuthStore.loggedIn
   */
  private async updateStateFromAuthStore(session: Session | undefined, isSignUp = false) {
    // TODO: make work in offline mode (save username offline)
    // TODO: don't trigger on refresh of other browser window

    // TODO: check errors?

    if (session) {
      // if the session is the same as previous, and we have a fully initialized user,
      // then there's no need to refresh
      if (
        this.userId === session.user.id &&
        this.user !== "loading" &&
        this.user !== "offlineNoUser" &&
        this.user.type === "user"
      ) {
        return;
      }
      
      let username = session.user.user_metadata.typecell_username;
      let profile_id = session.user.user_metadata.typecell_profile_nano_id;
      if (!username || !profile_id) {
        const usernameRes = await this.supabase
          .from("workspaces")
          .select()
          .eq("owner_user_id", session?.user.id)
          .eq("is_username", true);
          
        if (usernameRes.data?.length === 1) {
          username = usernameRes.data[0].name;
          profile_id = usernameRes.data[0].document_nano_id;
          await this.supabase.auth.updateUser({
            data: {
              typecell_username: username,
              typecell_profile_nano_id: profile_id,
            }
          })
        } else {
          if (!navigateRef) {
            throw new Error("no global navigateRef");
          }
          runInAction(() => {
            this.userId = session.user.id;
          });
          console.log("redirect");
          navigateRef.current?.("/username", { state: window.history?.state?.usr});
          // runInAction(() => {
          //   this.user = {
          //     type: "user",
          //     supabase: this.supabase,
          //     userId: "username",
          //     fullUserId: "username",
          //   };
          // });
        }
      }

      if (username) {
        if (!profile_id) {
          throw new Error("no profile id");
        }
        runInAction(() => {
          setDefaultShorthandResolver(new DefaultShorthandResolver()); // hacky
          this.userId = session.user.id;
          this.user = {
            type: "user",
            supabase: this.supabase,
            userId: username,
            fullUserId: username,
            profileId: profile_id,
            isSignUp
          };
        });
      }
    } else {
      runInAction(() => {
        setDefaultShorthandResolver(new DefaultShorthandResolver()); // hacky
        this.userId = undefined;
        this.user = {
          type: "guest-user",
          supabase: this.supabase,
        };
      });
    }
  }
}
