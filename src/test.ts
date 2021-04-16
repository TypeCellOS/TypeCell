import { IndexeddbPersistence, fetchUpdates, clearDocument } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";

import * as Y from "yjs";
// require("fake-indexeddb/auto");

export async function testyjs() {
  const id = "test1234";
  await clearDocument(id);

  const ydoc = new Y.Doc();
  const provider = new WebrtcProvider(id, ydoc);
  // provider.connect()
  // provider._storeTimeout = 0;
  //   ydoc2.getMap("x").set("hello", "hello");

  ydoc.getMap("map").set("x", 4);
  console.log("waitsync");
  await new Promise<void>((resolve) => {
    provider.on("synced", (_data: any) => {
      console.log("synced");
      resolve();
    });
    // resolve();
  });

  const ydoc2 = new Y.Doc();
  const provider2 = new IndexeddbPersistence(id, ydoc2);
  provider2._storeTimeout = 0;

  await new Promise<void>((resolve) => {
    provider2.on("synced", (_data: any) => {
      console.log("synced2");
      resolve();
    });
    // resolve();
  });
  ydoc2.getMap("hello").set("hello", "hello");

  // await fetchUpdates(provider);
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  await fetchUpdates(provider2);
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("done", ydoc.getMap("hello").get("hello"));
}
