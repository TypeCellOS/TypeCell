import { IndexeddbPersistence, fetchUpdates, clearDocument } from "y-indexeddb";

import * as Y from "yjs";
require("fake-indexeddb/auto");

beforeAll(() => {
  const nodeCrypto = require("crypto");
  (window as any).crypto = {
    getRandomValues: function (buffer: any) {
      console.error("hello");
    },
    subtle: () => console.error("hell2o"),
  };
});

// it("ydoc works", async () => {
//   const id = "test";
//   const ydoc = new Y.Doc();
//   const provider = new IndexeddbPersistence(id, ydoc);

//   //   ydoc2.getMap("x").set("hello", "hello");

//   await new Promise<void>((resolve) => {
//     provider.on("synced", (data) => {
//       console.log("synced");
//       resolve();
//     });
//     // resolve();
//   });
//   const ydoc2 = new Y.Doc();
//   const provider2 = new IndexeddbPersistence(id, ydoc2);

//   await new Promise<void>((resolve) => {
//     provider2.on("synced", (data) => {
//       console.log("synced2");
//       resolve();
//     });
//     // resolve();
//   });
//   ydoc2.getMap("qqq").set("hello", "hello");

//   fetchUpdates(provider);
//   await new Promise((resolve) => setTimeout(resolve, 2000));
//   fetchUpdates(provider);
//   await new Promise((resolve) => setTimeout(resolve, 2000));
//   console.log("done", ydoc.toJSON());

//   //   const indexedDBProvider = new IndexeddbPersistence(id, ydoc);
// });

it.skip("ydoc works", async () => {
  const id = "test";
  clearDocument(id);

  const ydoc = new Y.Doc();
  const provider = new IndexeddbPersistence(id, ydoc);
  provider._storeTimeout = 0;
  await provider.whenSynced;

  const ydoc2 = new Y.Doc();
  const provider2 = new IndexeddbPersistence(id, ydoc);
  provider2._storeTimeout = 0;
  await provider2.whenSynced;

  ydoc.getMap("mapname").set("key", "val");

  //   console.log(ydoc2.getMap("mapname").get("key"));
  //   console.log(ydoc2);

  await fetchUpdates(provider);
  await fetchUpdates(provider2);
  console.log(ydoc2.getMap("mapname").get("key"));
  //   //   ydoc2.getMap("x").set("hello", "hello");

  //   await new Promise<void>((resolve) => {
  //     provider.on("synced", (data) => {
  //       console.log("synced");
  //       resolve();
  //     });
  //     // resolve();
  //   });
  //   const ydoc2 = new Y.Doc();
  //   const provider2 = new IndexeddbPersistence(id, ydoc2);

  //   await new Promise<void>((resolve) => {
  //     provider2.on("synced", (data) => {
  //       console.log("synced2");
  //       resolve();
  //     });
  //     // resolve();
  //   });
  //   ydoc2.getMap("qqq").set("hello", "hello");

  //   fetchUpdates(provider);
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   fetchUpdates(provider);
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   console.log("done", ydoc.toJSON());

  //   //   const indexedDBProvider = new IndexeddbPersistence(id, ydoc);
  // });
});

it.skip("ydoc works", async () => {
  const id = "test";
  clearDocument(id);

  const ydoc = new Y.Doc();
  const ydoc2 = new Y.Doc();

  ydoc.getMap("mapname").set("key", "val");
  console.log(ydoc2.getMap("mapname").get("key"));
  Y.applyUpdate(ydoc2, Y.encodeStateAsUpdate(ydoc));
  console.log(ydoc2.getMap("mapname").get("key"));
  //   //   ydoc2.getMap("x").set("hello", "hello");

  //   await new Promise<void>((resolve) => {
  //     provider.on("synced", (data) => {
  //       console.log("synced");
  //       resolve();
  //     });
  //     // resolve();
  //   });
  //   const ydoc2 = new Y.Doc();
  //   const provider2 = new IndexeddbPersistence(id, ydoc2);

  //   await new Promise<void>((resolve) => {
  //     provider2.on("synced", (data) => {
  //       console.log("synced2");
  //       resolve();
  //     });
  //     // resolve();
  //   });
  //   ydoc2.getMap("qqq").set("hello", "hello");

  //   fetchUpdates(provider);
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   fetchUpdates(provider);
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   console.log("done", ydoc.toJSON());

  //   //   const indexedDBProvider = new IndexeddbPersistence(id, ydoc);
  // });
});
