import * as monaco from "monaco-editor";

async function getCompiledCodeInternal(
  process: monaco.languages.typescript.TypeScriptWorker,
  uri: monaco.Uri
) {
  const result = await process.getEmitOutput(uri.toString());

  const firstJS = result.outputFiles.find(
    (o: any) => o.name.endsWith(".js") || o.name.endsWith(".jsx")
  );
  const firstJSCode = (firstJS && firstJS.text) || "";

  const firstDTS = result.outputFiles.find((o: any) =>
    o.name.endsWith(".d.ts")
  );
  const firstDTSCode = (firstDTS && firstDTS.text) || "";

  // const ff = await process.getSemanticDiagnostics(uri.toString());

  // console.log("\n\n DIAGNOSTICS FOR " + uri.toString());

  // ff.forEach((diag) => {
  //   console.log(diag.messageText);
  // });

  return {
    firstJSCode,
    firstDTSCode,
  };
}

export type WorkerType = (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

export async function getCompiledCode(worker: WorkerType, uri: monaco.Uri) {
  const process = (await worker(uri))!;
  const uriCode = await getCompiledCodeInternal(process, uri);
  /*
        "define(["require", "exports"], function (require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        hello({ "takesNumber": "takesNumber" });
    });
    */

  try {
    const pluginCode = await getCompiledCodeInternal(
      process,
      (uri.toString() + ".pluginDetection.ts") as any
    );

    const possiblePlugins = await new Promise<string[]>((resolve) => {
      const exports: any = {};

      // eslint-disable-next-line
      const func = new Function(
        "let define = this.define; \n" + pluginCode.firstJSCode
      );
      func.apply({
        define: (
          deps: ["require", "exports"],
          func: (require: any, exports: any) => void
        ) => {
          func(undefined, exports);
          resolve(exports.default);
        },
      });
    });
    return {
      ...uriCode,
      possiblePlugins,
    };
  } catch (e) {
    // might need typescript update to fix, but then we also need to upgrade monaco
    // TODO console.error("fetching possiblePlugins failed", e);
    return {
      ...uriCode,
      possiblePlugins: [],
    };
  }
}
