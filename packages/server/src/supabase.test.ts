import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { beforeAll, it } from "vitest";
import ws from "ws";
import * as Y from "yjs";

beforeAll(async () => {
  // await resetSupabaseDB();
  // const server = Server.configure({
  //   extensions: [new SupabaseHocuspocus({})],
  //   debounce: 0,
  // });
  // await server.listen(1234);
});

it.skip("should sync user data via yjs", async () => {
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
    name: "example-document",
    document: ydoc,
    token: "hello",
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
  // await provider.connect();
  //   await p;
  //   provider.on("synced", () => {});
});
