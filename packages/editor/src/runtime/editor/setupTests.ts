// mock necessary for monaco
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

import { CustomTypeScriptWorker } from "./workers/ts.worker";
// @ts-ignore
import { SimpleWorkerServer } from "monaco-editor/esm/vs/base/common/worker/simpleWorker.js";
// @ts-ignore
import { EditorSimpleWorker } from "monaco-editor/esm/vs/editor//common/services/editorSimpleWorker.js";
import { CustomCSSWorker } from "./workers/css.worker";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

monaco.languages.register({
  id: "typescript",
  extensions: [".ts", ".tsx"],
  aliases: ["TypeScript", "ts", "typescript"],
  mimetypes: ["text/typescript"],
});

// method is similar to editor.worker.js from monaco-editor, but with "self" replaced by the passed in "worker" argument
function initialize(foreignModule: any, worker: any) {
  if (worker.initialized) {
    return;
  }
  worker.initialized = true;
  const simpleWorker = new SimpleWorkerServer(
    (msg: any) => {
      worker.postMessage(msg);
    },
    (host: any) => new EditorSimpleWorker(host, foreignModule)
  );
  worker.onmessage = (e: any) => {
    simpleWorker.onmessage(e);
  };
}

/**
 * Because jest runs in Node, browser workers are not available.
 * This is a polyfill that still uses our custom workers, but runs them on the main thread
 */
function getFakeMainThreadWorker(
  initializer: (context: any, createData: any) => any
) {
  const worker = {
    onmessage: () => {
      initialize(
        (context: any, createData: any) => initializer(context, createData),
        worker
      );
    },
  };

  const workerHost = {
    postMessage: function () {
      ((worker as any).onmessage as Function).apply(null, arguments);
    },
  };
  (worker as any).postMessage = function (data: any) {
    ((workerHost as any).onmessage as Function).apply(null, [{ data }]);
  };
  return workerHost;
}

(window as any).MonacoEnvironment = (global as any).MonacoEnvironment = {
  getWorker: function (workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") {
      return getFakeMainThreadWorker(
        (context: any, createData: any) =>
          new CustomTypeScriptWorker(context, createData)
      );
    }
    if (label === "json") {
      throw new Error("not implemented");
    }
    if (label === "css" || label === "scss" || label === "less") {
      return getFakeMainThreadWorker(
        (context: any, createData: any) =>
          new CustomCSSWorker(context, createData)
      );
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      throw new Error("not implemented");
    }
    return undefined;
  },
};
