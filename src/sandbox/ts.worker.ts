// based on https://github.com/microsoft/TypeScript-Website/issues/191#issuecomment-579531308
// and https://github.com/TypeScriptToLua/TypeScriptToLua.github.io/blob/source/src/pages/play/ts.worker.ts

import type * as ts from "typescript";
import EnumerateTransformer from "./transformers/ts-transformer-enumerate";
// import EnumerateTransformer from "ts-transformer-enumerate/transformer";

// @ts-ignore
import * as worker from "monaco-editor/esm/vs/editor/editor.worker";

// @ts-ignore
import { TypeScriptWorker } from "monaco-editor/esm/vs/language/typescript/tsWorker";
// import transformer from "./transformers/ts-transformer-enumerate";

export class CustomTypeScriptWorker extends TypeScriptWorker {
  constructor(context: any, createData: any) {
    super(context, createData);
  }

  public getCustomTransformers(): ts.CustomTransformers {
    return {
      before: [EnumerateTransformer((this as any)._languageService.getProgram())],
    };
  }

  public _getScriptText(fileName: string) {
    // always add an export {} statement, so that all files are modules, even if you have some script
    // that doesn't export anything. Otherwise the compiler will assume it's not a module and all variables
    // will be seen as globals
    let text = super._getScriptText(fileName);
    if (fileName.startsWith("file://") && (fileName.endsWith(".ts") || fileName.endsWith(".tsx"))) {
      text += "\nexport{};";
    }
    return text;
  }
}

globalThis.onmessage = () => {
  worker.initialize((context: any, createData: any) => new CustomTypeScriptWorker(context, createData));
};
