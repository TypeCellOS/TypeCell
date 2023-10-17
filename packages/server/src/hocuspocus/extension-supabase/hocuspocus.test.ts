/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Server } from "@hocuspocus/server";
import { ChildReference } from "@typecell-org/shared";
import {
  createDocument,
  createHPProvider,
  createRandomUser,
  createWsProvider,
} from "@typecell-org/shared-test";
import { beforeAll, describe, expect, it } from "vitest";
import { async } from "vscode-lib";
import ws from "ws";
import * as Y from "yjs";
import { SupabaseHocuspocus } from "./SupabaseHocuspocus";

let server: typeof Server;
beforeAll(async () => {
  // await resetSupabaseDB();
  server = Server.configure({
    extensions: [new SupabaseHocuspocus({})],
    debounce: 0,
  });
  await server.listen(0); // 0 for random port
});

describe("SupabaseHocuspocus", () => {
  let alice: Awaited<ReturnType<typeof createRandomUser>>;
  let bob: Awaited<ReturnType<typeof createRandomUser>>;

  beforeAll(async () => {
    console.log("create alice");
    alice = await createRandomUser("alice");
    console.log("create bob");
    bob = await createRandomUser("bob");
  });

  describe("Private", () => {
    let docId: string;
    beforeAll(async () => {
      const doc = createDocument(alice.user!.id, "", "no-access");
      const ret = await alice.supabase.from("documents").insert(doc).select();
      expect(ret.error).toBeNull();
      docId = ret.data![0].nano_id;
    });

    it("should sync when Alice reopens", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.webSocketURL, ws);

      const provider = createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider,
      );

      ydoc.getMap("mymap").set("hello", "world");

      // sync
      await async.timeout(100);

      //disconnect
      provider.disconnect();
      wsProvider.disconnect();

      await async.timeout(100);

      // reconnect
      await wsProvider.connect();

      const ydoc2 = new Y.Doc();
      createHPProvider(
        docId,
        ydoc2,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider,
      );

      await async.timeout(100);

      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
    });

    it("should sync when Alice opens 2 connections", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.webSocketURL, ws);

      createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider,
      );

      ydoc.getMap("mymap").set("hello", "world");

      const ydoc2 = new Y.Doc();
      const provider2 = createHPProvider(
        docId,
        ydoc2,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider,
      );

      ydoc2.getMap("anothermap").set("hello", "world");
      await async.timeout(1000);
      console.log(provider2.isConnected);
      console.log(provider2.unsyncedChanges);
      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
      expect(ydoc.getMap("anothermap").get("hello")).toBe("world");
    });

    it("should not sync to Bob", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.webSocketURL, ws);

      createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider,
      );

      ydoc.getMap("mymap").set("hello", "world");

      const ydoc2 = new Y.Doc();
      createHPProvider(
        docId,
        ydoc2,
        bob.session?.access_token + "", // TODO
        wsProvider,
      );
      ydoc2.getMap("anothermap").set("hello", "world");
      await async.timeout(100);
      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
      expect(ydoc.getMap("anothermap").get("hello")).toBe("world");
    });
  });

  describe("Public", () => {
    it("should sync when Alice reopens", async () => {});

    it("should sync when Alice opens 2 connections", async () => {});

    it("should sync to Bob", async () => {});

    it("should sync from Bob", async () => {});
  });

  describe("Readonly", () => {
    it("should sync when Alice reopens", async () => {});

    it("should sync when Alice opens 2 connections", async () => {});

    it("should sync to Bob", async () => {});

    it("should not sync from Bob", async () => {});
  });

  describe("Misc", () => {
    it("should not sync a non-existing doc", async () => {});

    it("should not sync changes to Bob after a doc has been made private", async () => {});
  });

  describe("child / parent refs", () => {
    let docId: string;
    let docDbID: string;

    let docBId: string;
    let docBDbID: string;

    beforeAll(async () => {
      const doc = createDocument(alice.user!.id, "", "no-access");
      const ret = await alice.supabase.from("documents").insert(doc).select();
      expect(ret.error).toBeNull();
      docId = ret.data![0].nano_id;
      docDbID = ret.data![0].id;

      const docB = createDocument(bob.user!.id, "", "no-access");
      const retB = await bob.supabase.from("documents").insert(docB).select();
      expect(retB.error).toBeNull();
      docBId = "typecell:typecell.org/" + retB.data![0].nano_id;
      docBDbID = retB.data![0].id;
    });

    it("should add and remove refs to database", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.webSocketURL, ws);

      createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider,
      );

      ydoc.getMap("refs").set("fakekey", {
        target: docBId,
        type: ChildReference.type,
        namespace: ChildReference.namespace,
      });

      await async.timeout(100);

      const refs = await alice.supabase
        .from("document_relations")
        .select()
        .eq("child_id", docBDbID)
        .eq("parent_id", docDbID);

      expect(refs.data?.length).toBe(1);

      ydoc.getMap("refs").delete("fakekey");

      await async.timeout(100);

      const newrefs = await alice.supabase
        .from("document_relations")
        .select()
        .eq("child_id", docBDbID)
        .eq("parent_id", docDbID);

      expect(newrefs.data?.length).toBe(0);
    });
  });
});
