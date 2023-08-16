/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import {
  createDocument,
  createHPProvider,
  createRandomUser,
  createWsProvider,
} from "@typecell-org/shared-test";
import { uniqueId } from "@typecell-org/util";
import { expect } from "chai";
import * as mobx from "mobx";
import { when } from "mobx";
import { async } from "vscode-lib";
import * as Y from "yjs";
import { loginAsNewRandomUser } from "../../../tests/util/loginUtil";
import { SupabaseSessionStore } from "../../app/supabase-auth/SupabaseSessionStore";
import { env } from "../../config/env";
import { parseIdentifier } from "../../identifiers";
import { SyncManager } from "./SyncManager";
import { TypeCellRemote } from "./remote/TypeCellRemote";

/**
 * Helper function that creates a doc in the backend and loads it into a SyncManager
 */
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

  createHPProvider(
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

export async function createDocInBackendAndWaitForLoad(
  user: Awaited<ReturnType<typeof createRandomUser>>,
  wsProvider: HocuspocusProviderWebsocket,
  sessionStore: SupabaseSessionStore,
  publicAccessLevel: "read" | "write" | "no-access" = "write"
) {
  const ret = await createDocInBackendAndLoad(
    user,
    wsProvider,
    sessionStore,

    publicAccessLevel
  );

  expect(ret.manager.docOrStatus).eq("loading");

  const manager = await ret.manager.waitTillLoaded();

  // wait till initial data came in
  await when(
    () => manager.state.localDoc.ydoc.getMap("mymap").get("hello") === "world"
  );

  return { ...ret, manager };
}

// /**
//  * Helper function to wait for a MobX dependent condition to eventually succeed
//  */
// async function whenExpect(condition: () => Chai.Assertion) {
//   return await when(() => {
//     try {
//       condition();
//     } catch (e) {
//       return false;
//     }
//     return true;
//   });
// }

describe("SyncManager tests", () => {
  let sessionStore: SupabaseSessionStore;
  let alice: Awaited<ReturnType<typeof createRandomUser>>;
  let wsProvider: HocuspocusProviderWebsocket;

  before(async () => {
    enableMobxBindings(mobx);
    alice = await createRandomUser("alice", env);
  });

  beforeEach(async () => {
    TypeCellRemote.Offline = false;
    wsProvider = createWsProvider("ws://localhost:1234");

    // initialize the main user we're testing
    // await coordinator.initialize();

    sessionStore = new SupabaseSessionStore(false, false);
    await sessionStore.initialize();

    await loginAsNewRandomUser(sessionStore, "testuser");

    // console.log("when", sessionStore.coordinators, sessionStore.userPrefix);
    await when(() => !!sessionStore.coordinators);
  });

  afterEach(async () => {
    await sessionStore.supabase.auth.signOut();
    sessionStore.dispose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionStore = undefined as any;
    wsProvider.destroy();
  });

  it("can load an unknown remote document online", async () => {
    const { manager } = await createDocInBackendAndWaitForLoad(
      alice,
      wsProvider,
      sessionStore
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

    // validate loading doesn't work, by waiting 1s and validate status is still loading
    await async.timeout(1000);
    expect(manager.docOrStatus).eq("loading");

    // go online
    TypeCellRemote.Offline = false;

    // validate loading
    const loadedManager = await manager.waitTillLoaded();

    // validate syncing
    expect(loadedManager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(loadedManager.state.localDoc.meta.create_source).eq("remote");
  });

  it("can load a known remote document", async () => {
    const { manager, identifier } = await createDocInBackendAndWaitForLoad(
      alice,
      wsProvider,
      sessionStore
    );

    // dispose
    manager.dispose();

    // load document
    const manager2 = SyncManager.load(identifier, sessionStore);
    const loadedManager2 = await manager2.waitTillLoaded();

    // validate syncing
    expect(loadedManager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(loadedManager2.state.localDoc.meta.create_source).eq("remote");
    manager2.dispose();
  });

  it("can load a known remote document offline", async () => {
    const { manager, identifier } = await createDocInBackendAndWaitForLoad(
      alice,
      wsProvider,
      sessionStore
    );

    // dispose
    manager.dispose();

    // go offline
    TypeCellRemote.Offline = true;

    // load document
    const manager2 = SyncManager.load(identifier, sessionStore);
    const loadedManager2 = await manager2.waitTillLoaded();

    // validate syncing
    expect(loadedManager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );

    expect(loadedManager2.state.localDoc.meta.create_source).eq("remote");
    manager2.dispose();
  });

  it("can create a new document", async () => {
    const id = parseIdentifier(uniqueId.generateId("document"));
    // create document
    const manager = SyncManager.create(id, sessionStore);

    const loadedManager = await manager.waitTillLoaded();
    loadedManager.state.localDoc.ydoc.getMap("mymap").set("hello", "world");

    await async.timeout(100); // write data

    manager.dispose();

    // TODO: both managers could load from local, so this is not a valid test
    // validate syncing
    const manager2 = SyncManager.load(id, sessionStore);

    const loadedManager2 = await manager2.waitTillLoaded();

    expect(loadedManager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
    manager2.dispose();
  });

  it("can create a new document offline", async () => {
    // go offline
    TypeCellRemote.Offline = true;

    // create document

    const id = parseIdentifier(uniqueId.generateId("document"));
    const manager = SyncManager.create(id, sessionStore);
    const loadedManager = await manager.waitTillLoaded();

    loadedManager.state.localDoc.ydoc.getMap("mymap").set("hello", "world");

    manager.dispose();

    // go online
    // validate syncing
    const manager2 = SyncManager.load(id, sessionStore);
    const loadedManager2 = await manager2.waitTillLoaded();

    expect(loadedManager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
    manager2.dispose();
  });

  it("can clear local status and reload", async () => {
    const { manager, backendYDoc } = await createDocInBackendAndWaitForLoad(
      alice,
      wsProvider,
      sessionStore,
      "read"
    );

    manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world2");

    // read only, so other doc shouldn't change even after waiting 1s
    await async.timeout(1000);
    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");

    // local doc should still reflect change
    expect(manager.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world2"
    );

    const manager2 = await manager.clearAndReload();
    const loadedManager2 = await manager2.waitTillLoaded();

    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");
    expect(loadedManager2.state.localDoc.ydoc.getMap("mymap").get("hello")).eq(
      "world"
    );
    manager2.dispose();
    manager.dispose();
  });

  it("can fork a document", async () => {
    const { manager, backendYDoc } = await createDocInBackendAndWaitForLoad(
      alice,
      wsProvider,
      sessionStore,
      "read"
    );

    manager.state.localDoc.ydoc.getMap("mymap").set("hello", "world2");

    // read only, so other doc shouldn't change even after waiting 1s
    await async.timeout(1000);
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

    const forkManagerLoaded = await forkManager.waitTillLoaded();
    const newManagerLoaded = await newManager.waitTillLoaded();

    expect(backendYDoc.getMap("mymap").get("hello")).eq("world");
    expect(
      forkManagerLoaded.state.localDoc.ydoc.getMap("mymap").get("hello")
    ).eq("world2");
    expect(
      newManagerLoaded.state.localDoc.ydoc.getMap("mymap").get("hello")
    ).eq("world");
    manager.dispose();
    forkManager.dispose();
    newManager.dispose();
  });
});
