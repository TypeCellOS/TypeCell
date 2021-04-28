// based on https://github.com/microsoft/TypeScript-Website/issues/191#issuecomment-579531308
// and https://github.com/TypeScriptToLua/TypeScriptToLua.github.io/blob/source/src/pages/play/ts.worker.ts

// @ts-ignore
import * as worker from "monaco-editor/esm/vs/editor/editor.worker";

// @ts-ignore
import { TypeScriptWorker } from "monaco-editor/esm/vs/language/typescript/tsWorker";

export class CustomTypeScriptWorker extends TypeScriptWorker {
  // eslint-disable-next-line
  constructor(context: any, createData: any) {
    super(context, createData);
  }

  public _getScriptText(fileName: string) {
    // always add an export {} statement, so that all files are modules, even if you have some script
    // that doesn't export anything. Otherwise the compiler will assume it's not a module and all variables
    // will be seen as globals
    let text = super._getScriptText(fileName);

    // for typecell modules (files named /!@owner/document/cell.(ts|tsx))
    // automatically import the context ($) of other cells
    // The type of this context is defined setupTypecellTypeResolver.ts, and available under !@owner/document
    if (
      fileName.startsWith("file:///%21%40") &&
      (fileName.endsWith(".ts") || fileName.endsWith(".tsx"))
    ) {
      let split = fileName.substr("file:///%21%40".length).split("/");

      if (split.length === 3 && fileName.endsWith(".cell.tsx")) {
        const folder = "!@" + split[0] + "/" + split[1];

        // add modified code at end, to not mess offsets
        text += `;\n
        // @ts-ignore
        import type * as $type from "${folder}";
        // @ts-ignore
        declare let $: typeof $type;
        // @ts-ignore
        import typecell from "typecell";
        // @ts-ignore
        import React from 'react';
        `;
        // always add an empty export to file to make sure it's seen as a module
        // text += "\nexport{};";
      }

      if (split.length === 3 && fileName.endsWith("plugin.tsx")) {
        // add modified code at end, to not mess offsets
        text += `;\n
        // @ts-ignore
        import plugin from "typecell-plugin";
        `;
        // always add an empty export to file to make sure it's seen as a module
        // text += "\nexport{};";
      }
    }

    return text;
  }
}

globalThis.onmessage = () => {
  worker.initialize(
    (context: any, createData: any) =>
      new CustomTypeScriptWorker(context, createData)
  );
};
