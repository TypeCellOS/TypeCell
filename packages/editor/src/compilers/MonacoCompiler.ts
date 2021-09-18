import * as monaco from "monaco-editor";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { hash } from "../util/hash";
import { CodeModel } from "@typecell-org/engine";
import { getCompiledCode, WorkerType } from "./monacoHelpers";

let mainWorker: WorkerType;

let initialPromise: Promise<void> | undefined;

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

async function _compile(model: TypeCellCodeModel) {
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
    mainWorker = await monaco.languages.typescript.getTypeScriptWorker();
  }

  let compiledCode = (await getCompiledCode(mainWorker, monacoModel.uri))
    .firstJSCode;
  model.releaseMonacoModel();
  if (ENABLE_CACHE) {
    saveCachedItem(model, { hash: hsh, compiledCode });
  }
  return compiledCode;
}

export const compile = awaitFirst(_compile);
