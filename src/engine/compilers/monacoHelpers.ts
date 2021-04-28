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
  return uriCode;
}
