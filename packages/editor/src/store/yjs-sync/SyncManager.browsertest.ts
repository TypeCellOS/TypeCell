/* eslint-disable @typescript-eslint/no-unused-expressions */
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { expect } from "chai";
import { when } from "mobx";
import * as Y from "yjs";
import {
  createDocument,
  createHPProvider,
  createRandomUser,
  createWsProvider,
} from "../../../../../packages/server/src/supabase/test/supabaseTestUtil";
import { SupabaseSessionStore } from "../../app/supabase-auth/SupabaseSessionStore";
import { parseIdentifier } from "../../identifiers";
import { SyncManager } from "./SyncManager";
import { TypeCellRemote } from "./remote/TypeCellRemote";

export function getRandomUserData(basename: string) {
  const randomID = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substring(0, 5);

  const name = basename + "-" + randomID;
  return {
    email: `${name}@email.com`,
    password: `password-${name}`,
    name,
  };
}

export async function createDocInBackend(
  user: Awaited<ReturnType<typeof createRandomUser>>,
  wsProvider: HocuspocusProviderWebsocket
) {
  // const user = await createRandomUser("backend-user");

  // initialize another user and doc directly via hocuspocus
  const ydoc = new Y.Doc();

  // const wsProvider = createWsProvider();

  const doc = await createDocument(user.user!.id, "", "write");
  const ret = await user.supabase.from("documents").insert(doc).select();

  expect(ret.error).null;

  const provider = createHPProvider(
    doc.nano_id,
    ydoc,
    user.session?.access_token + "$" + user.session?.refresh_token,
    wsProvider
  );

  return { user, doc, ydoc };
}

export async function loginAsNewRandomUser(
  sessionStore: SupabaseSessionStore,
  basename: string
) {
  const userData = getRandomUserData(basename);

  const { data, error } = await sessionStore.supabase.auth.signUp(userData);

  if (error) {
    throw error;
  }

  await when(() => !!sessionStore.userId);

  await sessionStore.setUsername(userData.name);

  return {
    user: data.user,
    session: data.session,
    supabase: sessionStore.supabase,
  };
}

describe("SyncManager tests", () => {
  let sessionStore: SupabaseSessionStore;
  let alice: Awaited<ReturnType<typeof createRandomUser>>;
  let wsProvider: HocuspocusProviderWebsocket;

  before(async () => {
    alice = await createRandomUser("alice");
  });

  beforeEach(async () => {
    wsProvider = createWsProvider();

    // initialize the main user we're testing
    // await coordinator.initialize();

    sessionStore = new SupabaseSessionStore();
    await sessionStore.initialize();

    await loginAsNewRandomUser(sessionStore, "testuser");
  });

  afterEach(async () => {
    await sessionStore.supabase.auth.signOut();
    sessionStore.dispose();
    sessionStore = undefined as any;
    wsProvider.destroy();
  });

  // it("directly importing a local module", async () => {
  //   await start();

  //   try
  //   const syncer = await SyncManager.create(
  //     sessionStore.getIdentifierForNewDocument(),
  //     sessionStore
  //   );
  //   console.log(syncer.doc);
  // });

  it("can load an unknown remote document online", async () => {
    const doc = await createDocInBackend(alice, wsProvider);
    doc.ydoc.getMap("mymap").set("hello", "world");

    // load document
    const manager = SyncManager.load(
      parseIdentifier(doc.doc.nano_id),
      sessionStore
    );
    expect(manager.docOrStatus).eq("loading");

    // validate loading goes ok
    await when(() => manager.state.status === "syncing");

    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // validate syncing
    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(manager.state.localDoc.meta.create_source).eq("remote");
  });

  it("cannot load an unknown remote document offline", async () => {
    const doc = await createDocInBackend(alice, wsProvider);
    doc.ydoc.getMap("mymap").set("hello", "world");

    // TODO: would be nicer to force browser to go offline
    // go offline
    TypeCellRemote.Offline = true;

    // load document
    const manager = SyncManager.load(
      parseIdentifier(doc.doc.nano_id),
      sessionStore
    );
    expect(manager.docOrStatus).eq("loading");

    // validate loading doesn't work
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(manager.docOrStatus).eq("loading");

    // go online
    TypeCellRemote.Offline = false;

    // validate loading
    await when(() => manager.state.status === "syncing");

    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    // validate syncing
    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(manager.state.localDoc.meta.create_source).eq("remote");
  });

  it("can load a known remote document", async () => {
    const doc = await createDocInBackend(alice, wsProvider);
    doc.ydoc.getMap("mymap").set("hello", "world");

    // load document
    const manager = SyncManager.load(
      parseIdentifier(doc.doc.nano_id),
      sessionStore
    );
    await when(() => manager.state.status === "syncing");
    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(manager.state.localDoc.meta.create_source).eq("remote");
    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
    // dispose
    manager.dispose();

    // load document
    const manager2 = SyncManager.load(
      parseIdentifier(doc.doc.nano_id),
      sessionStore
    );
    await when(() => manager2.state.status === "syncing");

    if (manager2.state.status !== "syncing") {
      throw new Error("unexpected");
    }
    // await manager2.state.localDoc.idbProvider.whenSynced;
    // await new Promise((resolve) => setTimeout(resolve, 100));
    // validate syncing
    expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(manager2.state.localDoc.meta.create_source).eq("remote");
  });

  it("can load a known remote document offline", async () => {
    const doc = await createDocInBackend(alice, wsProvider);
    doc.ydoc.getMap("mymap").set("hello", "world");

    // load document
    const manager = SyncManager.load(
      parseIdentifier(doc.doc.nano_id),
      sessionStore
    );
    await when(() => manager.state.status === "syncing");
    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(manager.state.localDoc.meta.create_source).eq("remote");
    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
    // dispose
    manager.dispose();

    // go offline
    TypeCellRemote.Offline = true;

    // load document
    const manager2 = SyncManager.load(
      parseIdentifier(doc.doc.nano_id),
      sessionStore
    );
    await when(() => manager2.state.status === "syncing");

    if (manager2.state.status !== "syncing") {
      throw new Error("unexpected");
    }
    // await manager2.state.localDoc.idbProvider.whenSynced;
    // await new Promise((resolve) => setTimeout(resolve, 100));
    // validate syncing
    expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(manager2.state.localDoc.meta.create_source).eq("remote");
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

  it("can load a known document that was created offline earlier", async () => {
    // go offline
    // create document
    // dispose
    // load document
    //
  });
});
