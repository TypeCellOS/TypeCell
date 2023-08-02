import { CodeModel } from "@typecell-org/engine";
import * as monaco from "monaco-editor";
import { hash, uri } from "vscode-lib";
import { MonacoTypeCellCodeModel } from "../../../models/MonacoCodeModel";

let mainWorker: WorkerType;

let initialPromise: Promise<void> | undefined;

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

type WorkerType = (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

async function getCompiledCode(worker: WorkerType, uri: monaco.Uri) {
  const process = (await worker(uri))!;
  const uriCode = await getCompiledCodeInternal(process, uri);
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
  model: CodeModel,
  item: { hash: string; compiledCode: string }
) {
  const key = "cc-" + model.path;
  localStorage.setItem(key, JSON.stringify(item));
}

function getCachedItem(model: CodeModel) {
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

async function getWorker(monacoInstance: typeof monaco) {
  if (mainWorker) {
    return mainWorker;
  }

  for (let tryN = 0; tryN < 5; tryN++) {
    try {
      mainWorker =
        await monacoInstance.languages.typescript.getTypeScriptWorker();
    } catch (e) {
      // https://github.com/BabylonJS/Babylon.js/pull/11554
      if (e === "TypeScript not registered!") {
        console.warn(e, "retry " + tryN);
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      } else {
        throw e;
      }
    }
  }

  return mainWorker;
}
async function _compile(model: CodeModel, monacoInstance: typeof monaco) {
  const tscode = model.getValue();
  const hsh = hash.stringHash(tscode, 0) + "";

  if (ENABLE_CACHE) {
    const cached = getCachedItem(model);
    if (cached && cached.hash === hsh) {
      console.log("cache hit", model.path);
      return cached.compiledCode;
    }
  }

  console.log("recompile", model.path);

  // const monacoModel = model.acquireMonacoModel();
  const monacoModel = monacoModelFromCodeModel(model);
  try {
    const worker = await getWorker(monacoInstance);
    let compiledCode = (await getCompiledCode(worker, monacoModel.uri))
      .firstJSCode;
    if (ENABLE_CACHE) {
      saveCachedItem(model, { hash: hsh, compiledCode });
    }
    // console.log(tscode, compiledCode);
    return compiledCode;
  } finally {
    // model.releaseMonacoModel();
  }
}

export const compile = awaitFirst(_compile);

function monacoModelFromCodeModel(model: CodeModel) {
  const existingModel = monaco.editor.getModel(uri.URI.parse(model.path));
  if (existingModel) {
    return existingModel;
  }

  if (model instanceof MonacoTypeCellCodeModel) {
    throw new Error(
      "unexpected, monaco should already have this model registered"
    );
  }

  // TODO: when to delete this model
  return monaco.editor.createModel(
    model.getValue(),
    model.language,
    uri.URI.parse(model.path)
  );
}
