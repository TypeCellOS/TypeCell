import * as Y from "yjs";
import { Event } from "../util/vscode-common/event";
import { createMatrixGuestClient } from "./MatrixGuestClient";
import MatrixProvider from "./MatrixProvider";
import {
  createRandomMatrixClient,
  createRandomMatrixClientAndRoom,
} from "./matrixTestUtil";
import {
  ensureMatrixIsRunning,
  HOMESERVER_NAME,
  matrixTestConfig,
} from "./matrixTestUtilServer";

jest.setTimeout(30000);

beforeAll(async () => {
  await ensureMatrixIsRunning();
});

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

async function getRoomAndTwoUsers(opts: {
  bobIsGuest: boolean;
  roomAccess: "public-read-write" | "public-read";
}) {
  const setup = await createRandomMatrixClientAndRoom(opts.roomAccess);
  const doc = new Y.Doc();
  const provider = new MatrixProvider(
    doc,
    setup.client,
    setup.roomName,
    HOMESERVER_NAME
  );

  const client2 = opts.bobIsGuest
    ? await createMatrixGuestClient(matrixTestConfig)
    : (await createRandomMatrixClient()).client;
  const doc2 = new Y.Doc();
  const provider2 = new MatrixProvider(
    doc2,
    client2,
    setup.roomName,
    HOMESERVER_NAME
  );

  return {
    alice: {
      doc,
      provider,
    },
    bob: {
      doc: doc2,
      provider: provider2,
    },
  };
}

async function validateOneWaySync(
  users: UnPromisify<ReturnType<typeof getRoomAndTwoUsers>>
) {
  const { alice, bob } = users;
  alice.doc.getMap("test").set("contents", new Y.Text("hello"));

  alice.provider.initialize();
  await alice.provider.waitForFlush();
  await new Promise((resolve) => setTimeout(resolve, 200));
  bob.provider.initialize();

  // validate initial state
  await Event.toPromise(bob.provider.onDocumentAvailable);
  expect(bob.doc.getMap("test").get("contents").toJSON()).toEqual("hello");
  expect(bob.doc.getMap("test2")).toBeUndefined;

  // send an update from provider and validate sync
  alice.doc.getMap("test2").set("key", 1);
  await alice.provider.waitForFlush();
  await Event.toPromise(bob.provider.onReceivedEvents);
  expect(bob.doc.getMap("test2").get("key")).toBe(1);

  // validate bob.provider is a read-only client (because it's a guestclient)
  expect(bob.provider.canWrite).toBe(true);
  bob.doc.getMap("test3").set("key", 1);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  expect(alice.doc.getMap("test3").get("key")).toBeUndefined;
  expect(bob.provider.canWrite).toBe(false);

  alice.provider.dispose();
  bob.provider.dispose();
}

async function validateTwoWaySync(
  users: UnPromisify<ReturnType<typeof getRoomAndTwoUsers>>
) {
  const { alice, bob } = users;
  alice.doc.getMap("test").set("contents", new Y.Text("hello"));

  alice.provider.initialize();
  await alice.provider.waitForFlush();
  await new Promise((resolve) => setTimeout(resolve, 200));
  bob.provider.initialize();

  // validate initial state
  await Event.toPromise(bob.provider.onDocumentAvailable);
  expect(bob.doc.getMap("test").get("contents").toJSON()).toEqual("hello");
  expect(bob.doc.getMap("test2")).toBeUndefined;

  // send an update from provider and validate sync
  alice.doc.getMap("test2").set("key", 1);
  await alice.provider.waitForFlush();
  await Event.toPromise(bob.provider.onReceivedEvents);
  expect(bob.doc.getMap("test2").get("key")).toBe(1);

  // validate bob can write
  expect(bob.provider.canWrite).toBe(true);
  bob.doc.getMap("test3").set("key", 1);
  await bob.provider.waitForFlush();
  await Event.toPromise(alice.provider.onReceivedEvents);
  expect(alice.doc.getMap("test3").get("key")).toBe(1);
  expect(bob.provider.canWrite).toBe(true);

  alice.provider.dispose();
  bob.provider.dispose();
}

it("syncs public room guest", async () => {
  const users = await getRoomAndTwoUsers({
    bobIsGuest: true,
    roomAccess: "public-read-write",
  });
  await validateOneWaySync(users);
});

it("syncs write-only access", async () => {
  const users = await getRoomAndTwoUsers({
    bobIsGuest: false,
    roomAccess: "public-read",
  });
  await validateOneWaySync(users);
});

it("syncs two users writing ", async () => {
  const users = await getRoomAndTwoUsers({
    bobIsGuest: false,
    roomAccess: "public-read-write",
  });
  await validateTwoWaySync(users);
});
