/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { expect } from "chai";
import * as mobx from "mobx";
import { when } from "mobx";
import { async } from "vscode-lib";
import { loginAsNewRandomUser } from "../../tests/util/loginUtil";
import { SupabaseSessionStore } from "../app/supabase-auth/SupabaseSessionStore";
import { DocConnection } from "./DocConnection";
import { DocumentInfo } from "./yjs-sync/DocumentCoordinator";
import { TypeCellRemote } from "./yjs-sync/remote/TypeCellRemote";

async function initSessionStore(name: string) {
  const sessionStore = new SupabaseSessionStore(false, false);
  await sessionStore.initialize();

  await loginAsNewRandomUser(sessionStore, name);

  await when(() => !!sessionStore.coordinators);
  await when(
    () => sessionStore.coordinators?.userPrefix === sessionStore.userPrefix
  );
  return sessionStore;
}

describe("BackgroundSyncer tests", () => {
  let sessionStoreAlice: SupabaseSessionStore;
  let sessionStoreBob: SupabaseSessionStore;

  before(async () => {
    enableMobxBindings(mobx);
  });

  beforeEach(async () => {

    // initialize the main user we're testing
    // await coordinator.initialize();

    sessionStoreAlice = await initSessionStore("alice");
    sessionStoreBob = await initSessionStore("bob");
  });

  afterEach(async () => {
    await sessionStoreAlice.supabase.auth.signOut();
    sessionStoreAlice.dispose();
    sessionStoreAlice = undefined as any;
    await sessionStoreBob.supabase.auth.signOut();
    sessionStoreBob.dispose();
    sessionStoreBob = undefined as any;
  });

  /**
   * This test is not directly related to backgroundsyncer, but makes sure that changes to a ydoc are persisted even if we immediately call dispose()
   */
  it("reloading a doc still has changes", async () => {
    const doc = await DocConnection.create(sessionStoreAlice);
    doc.ydoc.getMap("test").set("hello", "world");
    doc.dispose();

    expect(sessionStoreAlice.documentCoordinator?.documents.size).to.eq(2);
    expect(DocConnection.get(doc.identifier, sessionStoreAlice)).to.be
      .undefined;

    const reload = await DocConnection.load(doc.identifier, sessionStoreAlice);
    const reloadedDoc = await reload.waitForDoc();
    expect(reloadedDoc.ydoc.getMap("test").get("hello")).to.eq("world");
    reload.dispose();
  });

  it("creates document remotely that was created offline earlier", async () => {
    TypeCellRemote.Offline = true;
    const doc = await DocConnection.create(sessionStoreAlice);
    doc.ydoc.getMap("test").set("hello", "world");
    doc.dispose();

    await async.timeout(1000);

    // validate that document is kept around by background syncer
    expect(
      sessionStoreAlice.coordinators?.backgroundSyncer?.numberOfDocumentsSyncing
    ).to.eq(2);

    [...sessionStoreAlice.documentCoordinator!.documents.values()].forEach(
      (doc: DocumentInfo) => {
        expect(doc.exists_at_remote).to.be.false;
      }
    );

    TypeCellRemote.Offline = false;

    await when(
      () =>
        sessionStoreAlice.coordinators?.backgroundSyncer
          ?.numberOfDocumentsSyncing === 0
    );
    [...sessionStoreAlice.documentCoordinator!.documents.values()].forEach(
      (doc) => {
        
        expect(doc.exists_at_remote).to.be.true;
      }
    );
  });
});
