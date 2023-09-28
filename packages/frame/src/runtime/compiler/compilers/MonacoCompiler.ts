/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-spread */
import type * as monaco from "monaco-editor";
import { hash } from "vscode-lib";

let mainWorker: WorkerType;

let initialPromise: Promise<void> | undefined;

async function getCompiledCodeInternal(
  process: monaco.languages.typescript.TypeScriptWorker,
  uri: monaco.Uri,
) {
  const result = await process.getEmitOutput(uri.toString());

  const firstJS = result.outputFiles.find(
    (o: any) => o.name.endsWith(".js") || o.name.endsWith(".jsx"),
  );
  const firstJSCode = (firstJS && firstJS.text) || "";

  const firstDTS = result.outputFiles.find((o: any) =>
    o.name.endsWith(".d.ts"),
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const process = (await worker(uri))!;
  const uriCode = await getCompiledCodeInternal(process, uri);
  return uriCode;
}

// for performance: don't fire all compilations immediately. Compile once first, so we can use recompilation results
// TODO: verify performance improvement
// eslint-disable-next-line @typescript-eslint/ban-types
function awaitFirst<T extends Function>(func: T): T {
  return async function () {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    if (initialPromise) {
      try {
        await initialPromise;
      } catch (e) {
        // noop
      }
      return func.apply(null, args);
    }

    // eslint-disable-next-line no-async-promise-executor
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
  model: monaco.editor.ITextModel,
  item: { hash: string; compiledCode: string },
) {
  const key = "cc-" + model.uri.toString(false);
  localStorage.setItem(key, JSON.stringify(item));
}

function getCachedItem(model: monaco.editor.ITextModel) {
  const key = "cc-" + model.uri.toString(false);
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
async function _compile(
  model: monaco.editor.ITextModel,
  monacoInstance: typeof monaco,
) {
  const tscode = model.getValue();
  const hsh = hash.stringHash(tscode, 0) + "";

  if (ENABLE_CACHE) {
    const cached = getCachedItem(model);
    if (cached && cached.hash === hsh) {
      console.log("cache hit", model.uri.toString());
      return cached.compiledCode;
    }
  }

  console.log("recompile", model.uri.toString());

  try {
    const worker = await getWorker(monacoInstance);
    const compiledCode = (await getCompiledCode(worker, model.uri)).firstJSCode;
    if (ENABLE_CACHE) {
      saveCachedItem(model, { hash: hsh, compiledCode });
    }
    console.log(tscode, compiledCode);
    return compiledCode;
  } finally {
    // monacoModel.dispose();
    // model.releaseMonacoModel();
  }
}

export const compile = awaitFirst(_compile);
