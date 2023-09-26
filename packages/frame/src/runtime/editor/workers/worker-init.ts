// from https://github.com/microsoft/monaco-editor/issues/3019

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SimpleWorkerServer } from "monaco-editor/esm/vs/base/common/worker/simpleWorker.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EditorSimpleWorker } from "monaco-editor/esm/vs/editor/common/services/editorSimpleWorker.js";

export function initialize(foreignModule: any, port: any, initialized: any) {
  if (initialized) {
    return;
  }
  initialized = true;
  const simpleWorker = new SimpleWorkerServer(
    (msg: any) => {
      port.postMessage(msg);
    },
    (host: any) => new EditorSimpleWorker(host, foreignModule)
  );
  port.onmessage = (e: any) => {
    simpleWorker.onmessage(e.data);
  };
}
