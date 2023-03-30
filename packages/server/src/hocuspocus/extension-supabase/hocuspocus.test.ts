import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { Server } from "@hocuspocus/server";
import { beforeAll, describe, expect, it } from "vitest";
import ws from "ws";
import * as Y from "yjs";
import {
  createDocument,
  createRandomUser,
} from "../../supabase/test/supabaseTestUtil";
import { SupabaseHocuspocus } from "./SupabaseHocuspocus";

beforeAll(async () => {
  // await resetSupabaseDB();
  const server = Server.configure({
    extensions: [new SupabaseHocuspocus({})],
    debounce: 0,
  });
  await server.listen(1234);
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
    alice = await createRandomUser("alice");
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

    it.only("should sync when Alice reopens", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = new HocuspocusProviderWebsocket({
        url: "ws://localhost:1234",
        WebSocketPolyfill: ws,
      });

      const provider = new HocuspocusProvider({
        name: docId,
        document: ydoc,
        token: alice.session?.access_token + "$" + alice.session?.refresh_token,
        websocketProvider: wsProvider,
        broadcast: false,
      });

      ydoc.getMap("mymap").set("hello", "world");
      provider.disconnect();
      wsProvider.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await wsProvider.connect();

      const ydoc2 = new Y.Doc();
      const provider2 = new HocuspocusProvider({
        name: docId,
        document: ydoc2,
        token: alice.session?.access_token,
        websocketProvider: wsProvider,
        broadcast: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
    });

    it("should sync when Alice opens 2 connections", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = new HocuspocusProviderWebsocket({
        url: "ws://localhost:1234",
        WebSocketPolyfill: ws,
      });

      const provider = new HocuspocusProvider({
        name: docId,
        document: ydoc,
        token: alice.session?.access_token + "$" + alice.session?.refresh_token,
        websocketProvider: wsProvider,
        broadcast: false,
      });

      ydoc.getMap("mymap").set("hello", "world");

      const ydoc2 = new Y.Doc();
      const provider2 = new HocuspocusProvider({
        name: docId,
        document: ydoc2,
        token: alice.session?.access_token,
        websocketProvider: wsProvider,
        broadcast: false,
      });
      ydoc2.getMap("anothermap").set("hello", "world");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(ydoc2.getMap("mymap").get("hello")).toBe("world");
      expect(ydoc.getMap("anothermap").get("hello")).toBe("world");
    });

    it("should not sync to Bob", async () => {
      const ydoc = new Y.Doc();

      const wsProvider = new HocuspocusProviderWebsocket({
        url: "ws://localhost:1234",
        WebSocketPolyfill: ws,
      });

      const provider = new HocuspocusProvider({
        name: docId,
        document: ydoc,
        token: alice.session?.access_token + "$" + alice.session?.refresh_token,
        websocketProvider: wsProvider,
        broadcast: false,
      });

      ydoc.getMap("mymap").set("hello", "world");

      const ydoc2 = new Y.Doc();
      const provider2 = new HocuspocusProvider({
        name: docId,
        document: ydoc2,
        token: bob.session?.access_token,
        websocketProvider: wsProvider,
        broadcast: false,
      });
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
});
