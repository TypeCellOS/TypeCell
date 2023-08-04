/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable import/first */
// mock necessary for monaco
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

import { CustomTypeScriptWorker } from "./workers/ts.worker";
// @ts-ignore
import { SimpleWorkerServer } from "monaco-editor/esm/vs/base/common/worker/simpleWorker.js";
// @ts-ignore
import { EditorSimpleWorker } from "monaco-editor/esm/vs/editor//common/services/editorSimpleWorker.js";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import CSSWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";

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
 * Because tests runs in Node, browser workers are not available.
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
        (context: any, createData: any) => new CSSWorker()
      );
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      throw new Error("not implemented");
    }
    return undefined;
  },
};
