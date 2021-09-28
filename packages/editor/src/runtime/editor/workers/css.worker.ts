// based on https://github.com/microsoft/TypeScript-Website/issues/191#issuecomment-579531308
// and https://github.com/TypeScriptToLua/TypeScriptToLua.github.io/blob/source/src/pages/play/ts.worker.ts

// @ts-ignore
import * as worker from "monaco-editor/esm/vs/editor/editor.worker";

// @ts-ignore
import { CSSWorker } from "monaco-editor/esm/vs/language/css/cssWorker";

export class CustomCSSWorker extends CSSWorker {
  // eslint-disable-next-line
  constructor(context: any, createData: any) {
    super(context, createData);
  }
}

globalThis.onmessage = () => {
  worker.initialize(
    (context: any, createData: any) => new CustomCSSWorker(context, createData)
  );
};
