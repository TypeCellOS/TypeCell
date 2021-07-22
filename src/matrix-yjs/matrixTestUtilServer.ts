import * as cp from "child_process";
import fetch from "cross-fetch";
const { Worker, isMainThread } = require("worker_threads");

export const MATRIX_HOME_URL = new URL("http://localhost:8888/_matrix/static/");

export const HOMESERVER_NAME = "localhost:8888";
export const matrixTestConfig = {
  baseUrl: "http://" + HOMESERVER_NAME,
  // idBaseUrl: "https://vector.im",
};

let matrixStarted = false;

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

export async function ensureMatrixIsRunning() {
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
