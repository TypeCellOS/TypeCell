import * as cp from "child_process";
import fetch from "cross-fetch";
import { createRandomMatrixClientAndRoom } from "./benchmark/matrix.bench";
import { createMatrixGuestClient } from "./MatrixGuestClient";
import MatrixReader from "./MatrixReader";
import { sendMessage } from "./matrixUtil";

const MATRIX_HOME_URL = new URL("http://localhost:8888/_matrix/static/");

const HOMESERVER_NAME = "localhost:8888";
const config = {
  baseUrl: "http://" + HOMESERVER_NAME,
  // idBaseUrl: "https://vector.im",
};

let matrixStarted = false;

jest.setTimeout(300000);

async function hasMatrixStarted() {
  try {
    await fetch(MATRIX_HOME_URL.toString());
    return true;
  } catch (e) {
    return false;
  }
}

async function waitForMatrixStart() {
  while (true) {
    if (await hasMatrixStarted()) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }
}

async function ensureMatrixIsRunning() {
  if (!matrixStarted) {
    if (await hasMatrixStarted()) {
      matrixStarted = true;
    }
  }

  if (!matrixStarted) {
    matrixStarted = true;
    console.log("starting matrix");
    cp.execSync("docker-compose up -d", { cwd: "server/test/" });
  }

  await waitForMatrixStart();
}

beforeAll(async () => {
  await ensureMatrixIsRunning();
});

function validateMessages(messages: any[], count: number) {
  expect(messages.length).toBe(count);
  for (let i = 1; i <= count; i++) {
    expect(messages[i - 1].content.body).toEqual("message " + i);
  }
}

it("handles initial and live messages", async () => {
  let messageId = 0;
  const setup = await createRandomMatrixClientAndRoom();

  // send more than 1 page (30 messages) initially
  for (let i = 0; i < 40; i++) {
    await sendMessage(setup.client, setup.roomId, "message " + ++messageId);
  }

  const guestClient = await createMatrixGuestClient(config);
  const reader = new MatrixReader(guestClient, setup.roomId);
  const messages = await reader.getAllInitialEvents();

  reader.onMessages((msgs) => {
    messages.push.apply(messages, msgs);
  });
  reader.startPolling();

  while (messageId < 60) {
    await sendMessage(setup.client, setup.roomId, "message " + ++messageId);
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  validateMessages(messages, messageId);
});
