/* eslint-disable @typescript-eslint/no-unused-expressions */
import { HocuspocusProviderWebsocket } from "@hocuspocus/provider";

import { enableMobxBindings } from "@syncedstore/yjs-reactive-bindings";
import { expect } from "chai";
import * as mobx from "mobx";
import { when } from "mobx";
import { createWsProvider } from "../../../../packages/server/src/supabase/test/supabaseTestUtil";
import { loginAsNewRandomUser } from "../../tests/util/loginUtil";
import { SupabaseSessionStore } from "../app/supabase-auth/SupabaseSessionStore";
import { DocConnection } from "./DocConnection";
import { InboxValidator } from "./InboxValidatorStore";
import { ForkReference } from "./referenceDefinitions/fork";

async function initSessionStore(name: string) {
  const sessionStore = new SupabaseSessionStore(false);
  await sessionStore.initialize();

  await loginAsNewRandomUser(sessionStore, name);

  await when(() => !!sessionStore.coordinators);
  await when(
    () => sessionStore.coordinators?.userPrefix === sessionStore.userPrefix
  );
  return sessionStore;
}

describe.only("DocConnection tests", () => {
  let sessionStoreAlice: SupabaseSessionStore;
  let sessionStoreBob: SupabaseSessionStore;
  let wsProvider: HocuspocusProviderWebsocket;

  before(async () => {
    enableMobxBindings(mobx);
  });

  beforeEach(async () => {
    wsProvider = createWsProvider();

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
    wsProvider.destroy();
  });

  it("bob cannot modify doc by alice", async () => {
    const doc = await DocConnection.create(sessionStoreAlice);
    doc.ydoc.getMap("test").set("hello", "world");

    await when(() => doc.remote?.status === "loaded");

    const bobDoc = await DocConnection.load(doc.identifier, sessionStoreBob);
    const bobResource = await bobDoc.waitForDoc();
    expect(bobResource.ydoc.getMap("test").get("hello")).to.equal("world");

    bobResource.ydoc.getMap("test").set("hello", "from bob");

    await new Promise((resolve) => setTimeout(resolve, 3000));
    expect(doc.ydoc.getMap("test").get("hello")).to.equal("world");
  });

  it("can load an unknown remote document online", async () => {
    const doc = await DocConnection.create(sessionStoreAlice);
    doc.ydoc.getMap("test").set("hello", "world");

    await when(() => doc.remote!.status === "loaded");

    console.log("DOCID", doc.identifier);
    const bobDoc = await DocConnection.load(doc.identifier, sessionStoreBob);
    let bobResource = await bobDoc.waitForDoc();

    expect(bobResource.ydoc.getMap("test").get("hello")).to.equal("world");
    bobResource.ydoc.getMap("test").set("hello", "from bob");

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // expect(doc.ydoc.getMap("test").get("hello")).to.equal("world"); // TODO

    // // expect(bobResource.needsFork).to.be.true; TODO

    const fork = await bobResource.fork();

    // await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(fork.ydoc.getMap("test").get("hello")).to.equal("from bob");

    bobResource = await bobDoc.waitForDoc(); // TODO: we should be able to keep using the old resource
    // expect(bobResource.ydoc.getMap("test").get("hello")).to.equal("world"); TODO

    expect(fork.getRefs(ForkReference)).to.have.length(1);

    await new Promise((resolve) => setTimeout(resolve, 1000)); // TODO

    // TODO: convoluted API
    const r = await DocConnection.loadInboxResource(
      doc.identifier,
      sessionStoreAlice
    );

    console.log("inbox", r.identifier.toString(), r.ydoc.toJSON());

    const validator = new InboxValidator(r, ForkReference, (id) => {
      const doc = DocConnection.load(id, sessionStoreAlice);
      return doc.waitForDoc();
    });
    await new Promise((resolve) => setTimeout(resolve, 1000)); // TODO
    await when(() => validator.validRefMessages.length > 0);
    expect(validator.validRefMessages).to.have.length(1);
    expect(validator.validRefMessages[0].source).to.equal(
      fork.identifier.toString()
    );
  });
});
