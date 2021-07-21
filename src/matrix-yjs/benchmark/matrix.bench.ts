import * as http from "http";
import * as https from "https";
import { createClient, MatrixClient } from "matrix-js-sdk";
import * as Y from "yjs";
import uniqueId from "../../util/uniqueId";
import { Event } from "../../util/vscode-common/event";
import { createMatrixGuestClient } from "../MatrixGuestClient";
import MatrixProvider from "../MatrixProvider";
import { createMatrixDocument } from "../MatrixRoomManager";
import { createSimpleServer, runAutocannonFromNode } from "./util";
http.globalAgent.maxSockets = 2000;
https.globalAgent.maxSockets = 2000;

const HOMESERVER_NAME = "localhost:8888";
const config = {
  baseUrl: "http://" + HOMESERVER_NAME,
  // idBaseUrl: "https://vector.im",
};

const TEST_PASSWORD = "testpass";

async function createUser(username: string, password: string) {
  let matrixClient = createClient({
    baseUrl: config.baseUrl,
    // accessToken: access_token,
    // userId: user_id,
    // deviceId: device_id,
  });

  let sessionId: string | undefined;
  // first get a session_id. this is returned in a 401 response :/
  try {
    const result = await matrixClient.register(username, password);
    // console.log(result);
  } catch (e) {
    // console.log(e);
    sessionId = e.data.session;
  }

  // now register

  const result = await matrixClient.register(username, password, sessionId, {
    type: "m.login.dummy",
  });
  //   console.log(result);

  // login
  const loginResult = await matrixClient.loginWithPassword(username, password);
  // console.log(result);
  // result.access_token
  let matrixClientLoggedIn = createClient({
    baseUrl: config.baseUrl,
    accessToken: loginResult.access_token,
    // userId: user_id,
    // deviceId: device_id,
  });
  matrixClientLoggedIn._supportsVoip = false;
  matrixClientLoggedIn._clientOpts = {
    lazyLoadMembers: false,
  };
  return matrixClientLoggedIn;
}

export async function createRandomMatrixClientAndRoom() {
  const testId = uniqueId();
  const username = "testuser_" + testId;
  const roomName = "@" + username + "/test";
  const client = await createUser(username, TEST_PASSWORD);
  const result = await createMatrixDocument(client, "", roomName);

  if (typeof result === "string" || result.status !== "ok") {
    throw new Error("couldn't create room");
  }

  return {
    client,
    roomId: result.roomId,
    roomName,
  };
}

export async function setRoomContents(client: MatrixClient, roomName: string) {
  const doc = new Y.Doc();
  doc.getMap("test").set("contents", new Y.Text("hello"));
  const provider = new MatrixProvider(doc, client, roomName, HOMESERVER_NAME);
  await provider.waitForFlush();
}

let client: any;
async function readRoom(roomName: string) {
  if (!client) {
    client = await createMatrixGuestClient(config);
  }
  const doc = new Y.Doc();
  const provider = new MatrixProvider(doc, client, roomName, HOMESERVER_NAME);
  await Event.toPromise(provider.onDocumentAvailable);
  const text = doc.getMap("test").get("contents") as Y.Text;
  if (text.toJSON() !== "hello") {
    throw new Error("invalid contents of ydoc");
  }
  provider.dispose();
}

async function loadTest() {
  const setup = await createRandomMatrixClientAndRoom();

  await setRoomContents(setup.client, setup.roomId);
  const server = await createSimpleServer(() => readRoom(setup.roomName));
  await runAutocannonFromNode("http://localhost:8080");
  server.close();
}

// it("basic replace", async () => {
//   //   const testId = Math.round(Math.random() * 10000);
//   //   const username = "testuser_" + testId;
//   //   const roomName = "@" + username + "/test";

//   //   await createRoom(username, roomName);
//   //   await readRoom(roomName);
//   await loadTest();
// }, 30000);
loadTest();
