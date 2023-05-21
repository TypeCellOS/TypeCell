import * as cp from "child_process";
import fetch from "cross-fetch";

export const MATRIX_HOME_URL = new URL("http://localhost:8888/_matrix/static/");

let matrixStarted = false;

/**
 * Check whether a matrix server is running at MATRIX_HOME_URL
 */
async function hasMatrixStarted() {
  try {
    await fetch(MATRIX_HOME_URL.toString());
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Keeps checking every 2 seconds whether Matrix server is running at MATRIX_HOME_URL
 */
async function waitForMatrixStart() {
  while (true) {
    console.log("Waiting for Matrix to start...");
    if (await hasMatrixStarted()) {
      console.log("Matrix has started!");
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }
}

/**
 * Check if Matrix is running at MATRIX_HOME_URL
 *
 * If not, start it using docker-compuse
 *
 * Does not start Matrix using docker-compose in CI, because Github Actions
 * should take care of starting Matrix separately in CI
 */
async function doEnsureMatrixIsRunning() {
  if (!matrixStarted) {
    if (await hasMatrixStarted()) {
      matrixStarted = true;
    }
  }

  if (
    !matrixStarted &&
    (!process.env.CI || process.env.CI === "vscode-jest-tests") // In CI, Matrix should have already started using a Github action
  ) {
    matrixStarted = true;
    console.log("Starting matrix using docker-compose");
    const ret = cp.execSync("docker compose up -d", {
      cwd: "../../test-util/server/",
    });
    console.log(ret.toString("utf-8"));
  }

  await waitForMatrixStart();
}

let globalPromise: Promise<void> | undefined;

// wrap doEnsureMatrixIsRunning to make sure concurrent request only start Matrix once
export async function ensureMatrixIsRunning() {
  if (!globalPromise) {
    // globalPromise = doEnsureMatrixIsRunning();
  }
  return globalPromise;
}
