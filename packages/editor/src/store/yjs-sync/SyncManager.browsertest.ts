import { when } from "mobx";
import { SupabaseSessionStore } from "../../app/supabase-auth/SupabaseSessionStore";
import { SyncManager, coordinator } from "./SyncManager";

export function getRandomUserData(name: string) {
  return {
    email: `${name}-${Date.now() - Math.random()}@email.com`,
    password: `password-${name}`,
  };
}

export async function createRandomUser(
  sessionStore: SupabaseSessionStore,
  name: string
) {
  const userData = getRandomUserData(name);

  const { data, error } = await sessionStore.supabase.auth.signUp(userData);

  if (error) {
    throw error;
  }

  await when(() => !!sessionStore.userId);

  await sessionStore.setUsername(name);

  return {
    user: data.user,
    session: data.session,
    supabase: sessionStore.supabase,
  };
}

describe("SyncManager tests", () => {
  it("directly importing a local module", async () => {
    await coordinator.initialize();

    const sessionStore = new SupabaseSessionStore();
    await sessionStore.initialize();

    await createRandomUser(sessionStore, "testuser");

    const syncer = await SyncManager.create(
      sessionStore.getIdentifierForNewDocument(),
      sessionStore
    );
    console.log(syncer.doc);
  });

  it("can load an unknown remote document online", async () => {
    // load document
    // validate loading goes ok
    // validate syncing
  });

  it("cannot load an unknown remote document offline", async () => {
    // go offline
    // load document
    // validate loading doesn't work
    // go online
    // validate loading
    // validate syncing
  });

  it("can load a known remote document", async () => {
    // load document
    // dispose
    // load document
    // validate syncing
  });

  it("can load a known remote document offline", async () => {
    // load document
    // dispose
    // go offline
    // load document
  });

  it("can create a new document", async () => {
    // create document
    // validate syncing
  });

  it("can create a new document offline", async () => {
    // go offline
    // create document
    // go online
    // validate syncing
  });

  it("creates document remotely that was created offline earlier", async () => {
    // go offline
    // create document
    // dispose
    // go online
    // validate syncing
  });
});
