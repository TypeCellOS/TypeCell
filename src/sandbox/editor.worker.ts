// @ts-ignore
import * as worker from "monaco-editor/esm/vs/editor/editor.worker";

globalThis.onmessage = () => {
  worker.initialize();
};
