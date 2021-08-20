import { createClient } from "matrix-js-sdk";
import uniqueId from "../util/uniqueId";
import { createMatrixDocument } from "./MatrixRoomManager";
import * as http from "http";
import * as https from "https";
import { matrixTestConfig } from "./matrixTestUtilServer";

http.globalAgent.maxSockets = 2000;
https.globalAgent.maxSockets = 2000;

const TEST_PASSWORD = "testpass";

export async function createRandomMatrixClient() {
  const testId = uniqueId();
  const username = "testuser_" + testId;

  const client = await createMatrixUser(username, TEST_PASSWORD);

  return {
    username,
    client,
  };
}

export async function createRandomMatrixClientAndRoom(
  access: "public-read-write" | "public-read"
) {
  const { client, username } = await createRandomMatrixClient();
  const roomName = "@" + username + "/test";
  const result = await createMatrixDocument(client, "", roomName, access);

  if (typeof result === "string" || result.status !== "ok") {
    throw new Error("couldn't create room");
  }

  return {
    client,
    roomId: result.roomId,
    roomName,
  };
}

export async function createMatrixUser(username: string, password: string) {
  console.log("create", username);
  let matrixClient = createClient({
    baseUrl: matrixTestConfig.baseUrl,
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
    baseUrl: matrixTestConfig.baseUrl,
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
