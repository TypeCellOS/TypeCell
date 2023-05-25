/* eslint-disable @typescript-eslint/no-unused-expressions */
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { uniqueId } from "@typecell-org/common";
import { expect } from "chai";
import * as mobx from "mobx";
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

export async function createDocInBackendAndLoad(
  user: Awaited<ReturnType<typeof createRandomUser>>,
  wsProvider: HocuspocusProviderWebsocket,
  sessionStore: SupabaseSessionStore,
  publicAccessLevel: "read" | "write" | "no-access" = "write"
) {
  // const user = await createRandomUser("backend-user");

  // initialize another user and doc directly via hocuspocus
  const backendYDoc = new Y.Doc();

  // const wsProvider = createWsProvider();

  const doc = await createDocument(user.user!.id, "", publicAccessLevel);
  const ret = await user.supabase.from("documents").insert(doc).select();

  expect(ret.error).null;

  const provider = createHPProvider(
    doc.nano_id,
    backendYDoc,
    user.session?.access_token + "$" + user.session?.refresh_token,
    wsProvider
  );

  const identifier = parseIdentifier(doc.nano_id);

  // set some initial data
  backendYDoc.getMap("mymap").set("hello", "world");

  // load document with SyncManager
  const manager = SyncManager.load(identifier, sessionStore);

  return { user, doc, backendYDoc, manager, identifier };
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
    enableMobxBindings(mobx);
    alice = await createRandomUser("alice");
  });

  beforeEach(async () => {
    TypeCellRemote.Offline = false;
    wsProvider = createWsProvider();

    // initialize the main user we're testing
    // await coordinator.initialize();

    sessionStore = new SupabaseSessionStore();
    await sessionStore.initialize();

    await loginAsNewRandomUser(sessionStore, "testuser");

    console.log("when", sessionStore.coordinators, sessionStore.userPrefix);
    await when(() => !!sessionStore.coordinators);
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
    const { manager } = await createDocInBackendAndLoad(
      alice,
      wsProvider,
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
    // TODO: would be nicer to force browser to go offline
    TypeCellRemote.Offline = true;

    const { manager } = await createDocInBackendAndLoad(
      alice,
      wsProvider,
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
    const { manager, doc, identifier } = await createDocInBackendAndLoad(
      alice,
      wsProvider,
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
    const manager2 = SyncManager.load(identifier, sessionStore);
    await when(() => manager2.state.status === "syncing");

    if (manager2.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    // validate syncing
    expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(manager2.state.localDoc.meta.create_source).eq("remote");
  });

  it("can load a known remote document offline", async () => {
    const { manager, identifier } = await createDocInBackendAndLoad(
      alice,
      wsProvider,
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
    const manager2 = SyncManager.load(identifier, sessionStore);
    await when(() => manager2.state.status === "syncing");

    if (manager2.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    // validate syncing
    expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(manager2.state.localDoc.meta.create_source).eq("remote");
  });

  it("can create a new document", async () => {
    const id = parseIdentifier(uniqueId.generateId("document"));
    // create document
    const manager = SyncManager.create(id, sessionStore);

    await when(() => manager.state.status === "syncing");
    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    manager.dispose();

    // TODO: both managers could load from local, so this is not a valid test
    // validate syncing
    const manager2 = SyncManager.load(id, sessionStore);

    await when(() => manager2.state.status === "syncing");
    if (manager2.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
  });

  // it.only("instant create and load", async () => {
  //   const id = parseIdentifier(uniqueId.generateId("document"));
  //   // create document
  //   const manager = SyncManager.create(id, sessionStore);

  //   await when(() => manager.state.status === "syncing");
  //   if (manager.state.status !== "syncing") {
  //     throw new Error("unexpected");
  //   }

  //   manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world");
  //   manager.dispose();

  //   const manager2 = SyncManager.load(id, sessionStore);

  //   await when(() => manager2.state.status === "syncing");
  //   if (manager2.state.status !== "syncing") {
  //     throw new Error("unexpected");
  //   }

  //   expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
  //     "world"
  //   );
  // });

  it("can create a new document offline", async () => {
    // go offline
    TypeCellRemote.Offline = true;

    // create document

    const id = parseIdentifier(uniqueId.generateId("document"));
    const manager = SyncManager.create(id, sessionStore);

    await when(() => manager.state.status === "syncing");
    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    manager.dispose();

    // go online
    // validate syncing
    const manager2 = SyncManager.load(id, sessionStore);

    console.log("manager2", manager2.state.status);
    await when(() => manager2.state.status === "syncing");
    if (manager2.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    expect(manager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    // TODO: make sure it will be synced online
    // - make sure it will also sync without loading new syncmanager
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

  it("can clear local status and reload", async () => {
    const { manager, identifier, backendYDoc } =
      await createDocInBackendAndLoad(alice, wsProvider, sessionStore, "read");

    await when(() => manager.state.status === "syncing");
    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world2");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // read only, so shouldn't have changed
    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");

    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world2"
    );

    const newManager = await manager.clearAndReload();

    await when(() => newManager.state.status === "syncing");
    if (newManager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");
    expect(newManager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
  });

  it("can fork a document", async () => {
    const { manager, identifier, backendYDoc } =
      await createDocInBackendAndLoad(alice, wsProvider, sessionStore, "read");

    await when(() => manager.state.status === "syncing");
    if (manager.state.status !== "syncing") {
      throw new Error("unexpected");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world2");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // read only, so shouldn't have changed
    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");

    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world2"
    );

    // fork to a new doc
    const forkManager = await SyncManager.create(
      parseIdentifier(uniqueId.generateId("document")),
      sessionStore,
      manager.state.localDoc.ydoc
    );

    // revert existing doc
    const newManager = await manager.clearAndReload();

    await when(
      () =>
        forkManager.state.status === "syncing" &&
        newManager.state.status === "syncing"
    );
    if (
      forkManager.state.status !== "syncing" ||
      newManager.state.status !== "syncing"
    ) {
      throw new Error("unexpected");
    }

    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");
    expect(forkManager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world2"
    );
    expect(newManager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
  });
});
