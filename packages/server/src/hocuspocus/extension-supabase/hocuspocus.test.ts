import { Server } from "@hocuspocus/server";
import { beforeAll, describe, expect, it } from "vitest";
import ws from "ws";
import * as Y from "yjs";
import {
  createDocument,
  createHPProvider,
  createRandomUser,
  createWsProvider,
} from "../../supabase/test/supabaseTestUtil";
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
/*
it("should sync user data via yjs", async () => {
  const ydoc = new Y.Doc();

  let pResolve = () => {};
  const p = new Promise<void>((resolve) => {
    pResolve = resolve;
  });
  const wsProvider = new HocuspocusProviderWebsocket({
    url: "ws://localhost:1234",
    WebSocketPolyfill: ws,
  });

  const provider = new HocuspocusProvider({
    name: generateId(),
    document: ydoc,
    token: alice.session?.access_token,
    onAuthenticated: () => {
      console.log("onAuthenticated");
    },
    onAuthenticationFailed(data) {
      console.log("onAuthenticationFailed", data);
    },
    onStatus: (data) => {
      console.log("onStatus", data);
    },
    onSynced: () => {
      console.log("onSynced");
      pResolve();
    },
    onConnect() {
      console.log("onConnect");
    },
    websocketProvider: wsProvider,
    broadcast: false,
  });

  provider.on("awarenessUpdate", () => {
    console.log("awareness");
  });
  await p;
  ydoc.getMap("hello").set("world", "hello");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log("next change");
  ydoc.getMap("hello").set("world", "hello2");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // await provider.connect();
  //   await p;
  //   provider.on("synced", () => {});
});*/

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

    it.skip("should sync when Alice reopens", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.URL, ws);

      const provider = createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider
      );

      ydoc.getMap("mymap").set("hello", "world");
      provider.disconnect();
      wsProvider.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await wsProvider.connect();

      const ydoc2 = new Y.Doc();
      const provider2 = createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "", // TODO
        wsProvider
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
    });

    it.skip("should sync when Alice opens 2 connections", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.URL, ws);

      const provider = createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider
      );

      ydoc.getMap("mymap").set("hello", "world");

      const ydoc2 = new Y.Doc();
      const provider2 = createHPProvider(
        docId,
        ydoc2,
        alice.session?.access_token + "", // TODO
        wsProvider
      );

      ydoc2.getMap("anothermap").set("hello", "world");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
      expect(ydoc.getMap("anothermap").get("hello")).toBe("world");
    });

    it.skip("should not sync to Bob", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.URL, ws);

      const provider = createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider
      );

      ydoc.getMap("mymap").set("hello", "world");

      const ydoc2 = new Y.Doc();
      const provider2 = createHPProvider(
        docId,
        ydoc2,
        bob.session?.access_token + "", // TODO
        wsProvider
      );
      ydoc2.getMap("anothermap").set("hello", "world");
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      docBId = retB.data![0].nano_id;
      docBDbID = retB.data![0].id;
    });

    it.skip("should add and remove refs to database", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = createWsProvider(server.URL, ws);

      const provider = createHPProvider(
        docId,
        ydoc,
        alice.session?.access_token + "$" + alice.session?.refresh_token,
        wsProvider
      );

      ydoc.getMap("refs").set("fakekey", {
        target: docBId,
        type: "child",
        namespace: "typecell",
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refs = await alice.supabase
        .from("document_relations")
        .select()
        .eq("child_id", docBDbID)
        .eq("parent_id", docDbID);

      expect(refs.data?.length).toBe(1);

      ydoc.getMap("refs").delete("fakekey");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newrefs = await alice.supabase
        .from("document_relations")
        .select()
        .eq("child_id", docBDbID)
        .eq("parent_id", docDbID);

      expect(newrefs.data?.length).toBe(0);
    });
  });
});
