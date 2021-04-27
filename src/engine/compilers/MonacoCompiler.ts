import * as monaco from "monaco-editor";
import { TypeCellCodeModel } from "../../models/TypeCellCodeModel";
import { hash } from "../../util/hash";
import { CodeModel } from "../CodeModel";
import { getCompiledCode } from "./monacoHelpers";

// TODO: this should be moved outside of the /engine directory, and passed in externally
// because we don't need a reference to Monaco or to SharedModel in the /engine code.
let mainWorker: (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

let initialPromise: Promise<void> | undefined;

// for performance: don't fire all compilations immediately. Compile once first, so we can use recompilation results
// TODO: verify performance improvement
function awaitFirst<T extends Function>(func: T): T {
  return (async function () {
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
  } as any) as T;
}

const ENABLE_CACHE = false;

async function _compile(model: CodeModel) {
  const tscode = model.getValue();
  const hsh = hash(tscode) + "";

  if (ENABLE_CACHE) {
    const cached = localStorage.getItem(hsh);
    if (cached) {
      console.log("cache hit", model.path);
      return cached;
    }
  }

  console.log("recompile", model.path);
  const m = model as TypeCellCodeModel; // TODO;
  const mm = m.acquireMonacoModel();

  if (!mainWorker) {
    mainWorker = await monaco.languages.typescript.getTypeScriptWorker();
  }

  let code = (await getCompiledCode(mainWorker, mm.uri)).firstJSCode;
  m.releaseMonacoModel();
  if (ENABLE_CACHE) {
    localStorage.setItem(hsh, code);
  }
  return code;
}

export const compile = awaitFirst(_compile);
