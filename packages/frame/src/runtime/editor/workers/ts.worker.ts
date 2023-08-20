/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-globals */
// based on https://github.com/microsoft/TypeScript-Website/issues/191#issuecomment-579531308
// and https://github.com/TypeScriptToLua/TypeScriptToLua.github.io/blob/source/src/pages/play/ts.worker.ts

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { TypeScriptWorker } from "monaco-editor/esm/vs/language/typescript/ts.worker.js";
import { initialize } from "./worker-init";

export class CustomTypeScriptWorker extends TypeScriptWorker {
  // eslint-disable-next-line
  constructor(context: any, createData: any) {
    super(context, createData);
  }

  public _getScriptText(fileName: string): string {
    // always add an export {} statement, so that all files are modules, even if you have some script
    // that doesn't export anything. Otherwise the compiler will assume it's not a module and all variables
    // will be seen as globals
    let text = super._getScriptText(fileName);

    if (!fileName.startsWith("file:///")) {
      return text;
    }
    fileName = fileName.substring("file:///".length);
    const cleaned = decodeURIComponent(fileName);

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
        import * as React from 'react';
        `;
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

// for regular webWorker:

// globalThis.onmessage = () => {
//   worker.initialize(
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     (context: any, createData: any) =>
//       new CustomTypeScriptWorker(context, createData)
//   );
// };

// For SharedWorker:

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const connect = (port: any) => {
  // let initialized = false;
  port.onmessage = (e: any) => {
    initialize(
      function (ctx: any, createData: any) {
        return new CustomTypeScriptWorker(ctx, createData);
      },
      port,
      false
    );
  };
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.onconnect = (e) => {
  const [port] = e.ports;
  connect(port);
};

if (!("SharedWorkerGlobalScope" in self)) {
  connect(self);
}
