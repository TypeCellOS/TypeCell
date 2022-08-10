import * as monaco from "monaco-editor";
import { TypeCellCodeModel } from "../../../models/TypeCellCodeModel";
import { hash } from "../../../util/hash";

let mainWorker: WorkerType;

let initialPromise: Promise<void> | undefined;

async function getCompiledCodeInternal(
  process: monaco.languages.typescript.TypeScriptWorker,
  fileName: string
) {
  const result = await process.getEmitOutput(fileName);

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

type WorkerType = (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

async function getCompiledCode(worker: WorkerType, uri: monaco.Uri) {
  const process = (await worker(uri))!;
  const uriCode = await getCompiledCodeInternal(
    process,
    "file://" + uri.fsPath
  );
  return uriCode;
}

// for performance: don't fire all compilations immediately. Compile once first, so we can use recompilation results
// TODO: verify performance improvement
function awaitFirst<T extends Function>(func: T): T {
  return async function () {
    // @ts-ignore
    let args = arguments;
    if (initialPromise) {
      try {
        await initialPromise;
      } catch (e) {}
      return func.apply(null, args);
    }

    initialPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const ret = await func.apply(null, args);
        resolve(ret);
      } catch (e) {
        reject(e);
      }
    });
    return initialPromise;
  } as any as T;
}

// TODO: LRU cache or similar
const ENABLE_CACHE = true;

function saveCachedItem(
  model: TypeCellCodeModel,
  item: { hash: string; compiledCode: string }
) {
  const key = "cc-" + model.path;
  localStorage.setItem(key, JSON.stringify(item));
}

function getCachedItem(model: TypeCellCodeModel) {
  const key = "cc-" + model.path;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.hash && parsed.compiledCode) {
        return parsed as {
          hash: string;
          compiledCode: string;
        };
      } else {
        // invalid
        localStorage.removeItem(key);
      }
    } catch (e) {
      // invalid
      localStorage.removeItem(key);
    }
  }
  return undefined;
}

async function _compile(
  model: TypeCellCodeModel,
  monacoInstance: typeof monaco
) {
  const tscode = model.getValue();
  const hsh = hash(tscode) + "";

  if (ENABLE_CACHE) {
    const cached = getCachedItem(model);
    if (cached && cached.hash === hsh) {
      console.log("cache hit", model.path);
      return cached.compiledCode;
    }
  }

  console.log("recompile", model.path);
  const monacoModel = model.acquireMonacoModel();

  if (!mainWorker) {
    mainWorker =
      await monacoInstance.languages.typescript.getTypeScriptWorker();
  }

  try {
    let modelc = undefined;
    if (!modelc) {
      modelc = monacoInstance.editor.createModel(
        "",
        "json",
        monaco.Uri.parse("tsplus.config.js")
      );
    }
    modelc.setValue(`{
      "importMap":{
         "^(.*)/packages/([^/]*)/_src(.*)/index\.ts$":"@org/$2$3",
         "^(.*)/packages/([^/]*)/_src(.*)/abc\.ts$":"@org/$2$3",
         "^(.*)/packages/([^/]*)/_src(.*)\.ts$":"@org/$2$3",
         "^(.*)/packages/([^/]*)/_test/(.*)\.ts$":"@org/$2/test/$3",
         "^(.*)/packages/([^/]*)/_examples/(.*)\.ts$":"@org/$2/examples/$3",
         "^(.*)$":"@org/$2"
      },
      "traceMap":{
         "^(.*)/packages/([^/]*)/(.*)$":"(@org/$2) $3"
      }
   }`);
  } catch (e) {}
  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    `{
      "importMap":{
         "^(.*)/packages/([^/]*)/_src(.*)/index\.ts$":"@org/$2$3",
         "^(.*)/packages/([^/]*)/_src(.*)/abc\.ts$":"@org/$2$3",
         "^(.*)/packages/([^/]*)/_src(.*)\.ts$":"@org/$2$3",
         "^(.*)/packages/([^/]*)/_test/(.*)\.ts$":"@org/$2/test/$3",
         "^(.*)/packages/([^/]*)/_examples/(.*)\.ts$":"@org/$2/examples/$3",
         "^(.*)$":"@org/$2"
      },
      "traceMap":{
         "^(.*)/packages/([^/]*)/(.*)$":"(@org/$2) $3"
      }
   }`,
    "tsplus.config.js"
  );
  let model1 = monacoInstance.editor.getModel(monaco.Uri.parse("test.ts"));
  if (!model1) {
    model1 = monacoInstance.editor.createModel(
      "",
      "typescript",
      monaco.Uri.parse("test.ts")
    );
  }
  model1.setValue(model.getValue());
  let compiledCode = (await getCompiledCode(mainWorker, model1.uri))
    .firstJSCode;
  model.releaseMonacoModel();
  if (ENABLE_CACHE) {
    saveCachedItem(model, { hash: hsh, compiledCode });
  }
  // console.log(tscode, compiledCode);
  return compiledCode;
}

export const compile = awaitFirst(_compile);
