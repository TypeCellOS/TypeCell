import got from "got";
import { MatrixClient, request } from "matrix-js-sdk";
import * as qs from "qs";
import { autocannonSeparateProcess } from "./benchmark/util";
import { createMatrixGuestClient } from "./matrixGuestClient";
import { MatrixReader } from "./MatrixReader";
import { createRandomMatrixClientAndRoom } from "./matrixTestUtil";
import {
  ensureMatrixIsRunning,
  HOMESERVER_NAME,
  matrixTestConfig,
} from "./matrixTestUtilServer";
import { sendMessage } from "./matrixUtil";
const { Worker, isMainThread } = require("worker_threads");

// change http client in matrix, this is faster than request when we have many outgoing requests
request((opts: any, cb: any) => {
  opts.url = opts.url || opts.uri;
  opts.searchParams = opts.qs;
  opts.decompress = opts.gzip;
  // opts.responseType = "json";
  opts.throwHttpErrors = false;
  if (!opts.json) {
    delete opts.json;
  }
  const responsePromise = got(opts);
  const ret = responsePromise.then(
    (response) => {
      cb(undefined, response, response.body);
    },
    (e) => {
      cb(e, e.response, e.response.body);
    }
  );
  (ret as any).abort = responsePromise.cancel;
  return ret;
});

jest.setTimeout(100000);

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
  const setup = await createRandomMatrixClientAndRoom("public-read");

  // send more than 1 page (30 messages) initially
  for (let i = 0; i < 40; i++) {
    await sendMessage(setup.client, setup.roomId, "message " + ++messageId);
  }

  const guestClient = await createMatrixGuestClient(matrixTestConfig);
  const reader = new MatrixReader(guestClient, setup.roomId);
  try {
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
  } finally {
    reader.dispose();
  }
});

class TestReader {
  private static CREATED = 0;

  public messages: any[] | undefined;
  private reader: MatrixReader | undefined;
  constructor(
    private config: any,
    private roomId: string,
    private client?: MatrixClient
  ) {}

  async initialize() {
    const guestClient =
      this.client || (await createMatrixGuestClient(matrixTestConfig));
    this.reader = new MatrixReader(guestClient, this.roomId);

    this.messages = await this.reader.getAllInitialEvents();
    console.log("created", TestReader.CREATED++);
    this.reader.onMessages((msgs) => {
      // console.log("on message");
      this.messages!.push.apply(this.messages, msgs);
    });
    this.reader.startPolling();
  }

  dispose() {
    this.reader?.dispose();
  }
}

// Breaks at 500 parallel requests locally
it.skip("handles parallel live messages", async () => {
  const PARALLEL = 500;
  let messageId = 0;
  const setup = await createRandomMatrixClientAndRoom("public-read");

  const readers = [];
  try {
    const client = await createMatrixGuestClient(matrixTestConfig);
    for (let i = 0; i < PARALLEL; i++) {
      // const worker = new Worker(__dirname + "/worker.js", {
      //   workerData: {
      //     path: "./MatrixReader.test.ts",
      //   },
      // });
      readers.push(new TestReader(matrixTestConfig, setup.roomId, client));
    }

    // return;
    await Promise.all(readers.map((reader) => reader.initialize()));

    while (messageId < 10) {
      // console.log("send message");
      await sendMessage(setup.client, setup.roomId, "message " + ++messageId);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    readers.map((r) => validateMessages(r.messages!, messageId));
  } finally {
    readers.map((r) => r.dispose());
  }
});

// gets slow at around 500 messages, but calls to http://localhost:8888/_matrix/static/ also at around 1k
it.skip("handles parallel live messages autocannon", async () => {
  const PARALLEL = 500;

  let messageId = 0;
  const setup = await createRandomMatrixClientAndRoom("public-read");

  const client = await createMatrixGuestClient(matrixTestConfig);
  const reader = new MatrixReader(client, setup.roomId);
  try {
    await reader.getAllInitialEvents();

    const params = {
      access_token: client._http.opts.accessToken,
      from: reader.latestToken,
      room_id: setup.roomId,
      timeout: 30000,
    };

    // send some new messages beforehand
    while (messageId < 10) {
      // console.log("send message");
      await sendMessage(setup.client, setup.roomId, "message " + ++messageId);
    }

    const uri =
      "http://" +
      HOMESERVER_NAME +
      "/_matrix/client/r0/events?" +
      qs.stringify(params);
    autocannonSeparateProcess([
      "-c",
      PARALLEL + "",
      "-a",
      PARALLEL + "",
      "-t",
      "20",
      uri,
    ]);

    // send some new messages in parallel / after
    while (messageId < 20) {
      // console.log("send message");
      await sendMessage(setup.client, setup.roomId, "message " + ++messageId);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
  } finally {
    reader.dispose();
  }
});
