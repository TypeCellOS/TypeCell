import fetch from "cross-fetch";

import * as cp from "child_process";
import { createSimpleServer, runAutocannonFromNode } from "./util";
import * as http from "http";

// In this file, we compare different ways of benchmarking.
// This can be used to estimate the overhead of our benchmarking process
// We use the Matrix home page url as test (which is a static page, so Synapse, the Matrix server, should process it quickly)

http.globalAgent.maxSockets = 20000;

const MATRIX_HOME_URL = new URL("http://localhost:8888/_matrix/static/");
const NODE_SERVER_PORT = 8080;

/**
 * - Call Autocannon from Node
 * - Autocannon requests a page from a local node server
 * - This node server requests the test page using Fetch
 */
async function autocannonViaServerFetch() {
  console.log("autocannonViaServerFetch");
  const server = await createSimpleServer(async (req, res) => {
    const result = await fetch(MATRIX_HOME_URL.toString());
    // const ret = await result.text();
    // if (!ret.includes("Welcome to the Matrix")) {
    //   throw new Error("unexpected result");
    // }
  }, NODE_SERVER_PORT);
  await runAutocannonFromNode("http://localhost:" + NODE_SERVER_PORT);
  server.close();
}

/**
 * - Call Autocannon from Node
 * - Autocannon requests a page from a local node server
 * - This node server requests the test page using Fetch, with a customized Agent
 */
async function autocannonViaServerFetchAgent() {
  console.log("autocannonViaServerFetchAgent");
  const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 100000,
  });

  const server = await createSimpleServer(async (req, res) => {
    const result = await fetch(MATRIX_HOME_URL.toString(), {
      agent: function () {
        return httpAgent;
      },
    } as any);

    // const ret = await result.text();
    // if (!ret.includes("Welcome to the Matrix")) {
    //   throw new Error("unexpected result");
    // }
  }, NODE_SERVER_PORT);
  await runAutocannonFromNode("http://localhost:" + NODE_SERVER_PORT);
  server.close();
}

/**
 * - Call Autocannon from Node
 * - Autocannon requests a page from a local node server
 * - This node server requests the test page using http.get, without agent
 */
async function autocannonViaServerHttpNoAgent() {
  console.log("autocannonViaServerHttpNoAgent");
  const server = await createSimpleServer(async (req, res) => {
    await new Promise<void>((resolve) => {
      http.get(
        {
          hostname: MATRIX_HOME_URL.hostname,
          port: MATRIX_HOME_URL.port,
          path: MATRIX_HOME_URL.pathname,
          agent: false, // Create a new agent just for this one request
        },
        (res) => {
          // Do stuff with response
          resolve();
        }
      );
    });
  }, NODE_SERVER_PORT);
  await runAutocannonFromNode("http://localhost:" + NODE_SERVER_PORT);
  server.close();
}

/**
 * - Call Autocannon from Node
 * - Autocannon requests a page from a local node server
 * - This node server requests the test page using http.get
 */
async function autocannonViaServerHttp() {
  console.log("autocannonViaServerHttp");
  const server = await createSimpleServer(async (req, res) => {
    await new Promise<void>((resolve) => {
      http.get(
        {
          hostname: MATRIX_HOME_URL.hostname,
          port: MATRIX_HOME_URL.port,
          path: MATRIX_HOME_URL.pathname,
        },
        (res) => {
          // Do stuff with response
          resolve();
        }
      );
    });
  }, NODE_SERVER_PORT);
  await runAutocannonFromNode("http://localhost:" + NODE_SERVER_PORT);
  server.close();
}

/**
 * - Call Autocannon from Node
 * - Autocannon requests the test page directly
 */
async function autocannonFromNode() {
  console.log("autocannonFromNode");
  await runAutocannonFromNode(MATRIX_HOME_URL.toString());
}

/**
 * - Call autocannon in a separate process, which calls the test page directly
 */
async function autocannonSeparateProcess() {
  console.log("autocannonSeparateProcess");

  const ls = cp.spawn("./node_modules/.bin/autocannon", [
    "-c",
    "10",
    MATRIX_HOME_URL.toString(),
  ]);
  return new Promise<void>((resolve) => {
    ls.stdout.on("data", (data: any) => {
      console.log(`stdout: ${data}`);
    });

    ls.stderr.on("data", (data: any) => {
      console.error(`stderr: ${data}`);
    });

    ls.on("close", (code: any) => {
      console.log(`child process exited with code ${code}`);
      resolve();
    });
  });
}

async function runAllTests() {
  await autocannonSeparateProcess();
  await autocannonFromNode();
  await autocannonViaServerHttp();
  await autocannonViaServerHttpNoAgent();
  await autocannonViaServerFetch();
  await autocannonViaServerFetchAgent();
}
runAllTests();
