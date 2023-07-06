// based on https://github.com/microsoft/TypeScript-Website/issues/191#issuecomment-579531308
// and https://github.com/TypeScriptToLua/TypeScriptToLua.github.io/blob/source/src/pages/play/ts.worker.ts
import type * as ts from "typescript";
// @ts-ignore
import * as worker from "monaco-editor/esm/vs/editor/editor.worker.js";

// @ts-ignore
import { TypeScriptWorker } from "monaco-editor/esm/vs/language/typescript/ts.worker.js";
import testTransformer from "./TestTransformer";

export class CustomTypeScriptWorker extends TypeScriptWorker {
  // eslint-disable-next-line
  constructor(context: any, createData: any) {
    super(context, createData);
  }

  public getCustomTransformers(): ts.CustomTransformers {
    return {
      before: [
        // () => {
        //   debugger;
        //   return (node) => {
        //     return node;
        //   };
        // },
        testTransformer((this as any)._languageService.getProgram(), {}),
      ],
    };
  }

  public _getScriptText(fileName: string): string {
    // always add an export {} statement, so that all files are modules, even if you have some script
    // that doesn't export anything. Otherwise the compiler will assume it's not a module and all variables
    // will be seen as globals
    let text = super._getScriptText(fileName);

    if (!fileName.startsWith("file:///")) {
      return text;
    }
    fileName = fileName.substr("file:///".length);
    let cleaned = decodeURIComponent(fileName);

    // remove .edit.*.tsx from end of path
    cleaned = cleaned.replace(/\.edit\..*\.tsx$/, "");
    // console.log("worker", cleaned, fileName);
    // for typecell modules (files named /!@owner/document/cell.(ts|tsx))
    // automatically import the context ($) of other cells
    // The type of this context is defined setupTypecellTypeResolver.ts, and available under !@owner/document
    if (
      cleaned.startsWith("!") &&
      (cleaned.endsWith(".ts") || cleaned.endsWith(".tsx"))
    ) {
      if (cleaned.endsWith(".cell.tsx")) {
        // const folder = "!@" + split[0] + "/" + split[1];
        const folder = cleaned
          .substring(0, cleaned.lastIndexOf("/"))
          .replace("//", "/");
        // console.log("folder", folder);
        // add modified code at end, to not mess offsets
        text += `;\n

        // @ts-ignore
        import type { OnlyViews, Values } from "typecell-helpers";

        // @ts-ignore
        import type * as $types from "${folder}";
        
        // @ts-ignore
        declare let $: Values<typeof $types>;

        // @ts-ignore
        declare let $views: OnlyViews<typeof $types>;

        // @ts-ignore
        import typecell from "typecell";
        
        // @ts-ignore
        import * as React from 'react';`;
        // always add an empty export to file to make sure it's seen as a module
        // text += "\nexport{};";
      }

      if (cleaned.endsWith("plugin.tsx")) {
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
