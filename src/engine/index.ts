import * as monaco from "monaco-editor";
import { createCellEvaluator } from "./CellEvaluator";
import { createContext, TypeCellContext } from "./context";
import { getCompiledCode } from "./monacoHelpers";

function hash(str: string) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

const evaluatorCache = new Map<
  monaco.editor.ITextModel,
  ReturnType<typeof createCellEvaluator>
>();

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
      await initialPromise;
      return func.apply(null, args);
    }

    initialPromise = new Promise<void>(async (resolve) => {
      try {
        const ret = await func.apply(null, args);
        return ret;
      } finally {
        resolve();
      }
    });
    return initialPromise;
  } as any) as T;
}

async function evaluateUpdate(
  model: monaco.editor.ITextModel,
  typecellContext: TypeCellContext,
  exposeGlobalVariables: { [key: string]: any },
  resolveImport: (module: string) => Promise<any>,
  onOutput: (model: monaco.editor.ITextModel, output: any) => void
) {
  if (!mainWorker) {
    mainWorker = await monaco.languages.typescript.getTypeScriptWorker();
  }

  if (!evaluatorCache.has(model)) {
    evaluatorCache.set(
      model,
      createCellEvaluator(
        typecellContext,
        exposeGlobalVariables,
        resolveImport,
        true,
        (output) => onOutput(model, output)
      )
    );
  }
  const evaluator = evaluatorCache.get(model)!;

  const tscode = model.getValue();
  const hsh = hash(tscode) + "";
  const cached = localStorage.getItem(hsh);
  if (cached) {
    await evaluator.evaluate(cached);
  } else {
    let code = (await getCompiledCode(mainWorker, model.uri)).firstJSCode;
    localStorage.setItem(hsh, code);
    await evaluator.evaluate(code);
  }
}

const evaluateUpdateSingleInitial = awaitFirst(evaluateUpdate);

export class Engine {
  public readonly observableContext = createContext({} as any);
  private readonly registeredModels = new Set<monaco.editor.ITextModel>();

  constructor(
    private onOutput: (model: monaco.editor.ITextModel, output: any) => void,
    private exposeGlobalVariables: { [key: string]: any } = {},
    private resolveImport: (
      module: string,
      forModel: monaco.editor.ITextModel
    ) => Promise<any>
  ) {}

  public registerModel(model: monaco.editor.ITextModel) {
    if (this.registeredModels.has(model)) {
      console.warn("model already registered"); // TODO: shouldn't happen
      return;
    }
    this.registeredModels.add(model);
    model.onDidChangeContent((e) => {
      evaluateUpdateSingleInitial(
        model,
        this.observableContext,
        this.exposeGlobalVariables,
        (moduleName: string) => this.resolveImport(moduleName, model),
        this.onOutput
      ); // catch errors?
    });

    model.onWillDispose(() => {
      evaluatorCache.delete(model);
    });
  }
}
