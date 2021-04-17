import * as monaco from "monaco-editor";
import { createCellEvaluator } from "./CellEvaluator";
import { createContext, TypeCellContext } from "./context";
import { getCompiledCode } from "./monacoHelpers";

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

/**
 * The engine automatically runs models registered to it.
 * The code of the models is passed a context ($) provided by the engine.
 * This context is how the code of different models can react to each other.
 *
 * @export
 * @class Engine
 */
export class Engine {
  private disposed = false;
  private disposers: Array<() => void> = [];
  public readonly observableContext = createContext({} as any);
  private readonly registeredModels = new Set<monaco.editor.ITextModel>();

  private readonly evaluatorCache = new Map<
    monaco.editor.ITextModel,
    ReturnType<typeof createCellEvaluator>
  >();
  /**
   *
   * @param onOutput Called whenever a model is reevaluated, with the exports by that model
   * @param exposeGlobalVariables A Map of global variables passed to the execution of models
   * @param resolveImport Function (resolver) to resolve imports
   */
  constructor(
    private onOutput: (model: monaco.editor.ITextModel, output: any) => void,
    private exposeGlobalVariables: { [key: string]: any } = {},
    private resolveImport: (
      module: string,
      forModel: monaco.editor.ITextModel
    ) => Promise<any>
  ) {}

  /**
   * Register a model to the engine. After registering, the model will be observed for changes and automatically re-evaluated.
   *
   * When the model is disposed (model.dispose()), the model is automatically unregistered.
   * @param model model to register
   */
  public registerModel(model: monaco.editor.ITextModel) {
    if (this.disposed) {
      throw new Error("registering model on disposed engine");
    }
    if (this.registeredModels.has(model)) {
      console.warn("model already registered"); // TODO: shouldn't happen
      return;
    }
    this.registeredModels.add(model);
    const evaluate = () => {
      this.evaluateUpdateSingleInitial(
        model,
        this.observableContext,
        this.exposeGlobalVariables,
        (moduleName: string) => this.resolveImport(moduleName, model),
        this.onOutput
      ); // catch errors?
    };
    let initialValue: string | undefined = model.getValue();

    this.disposers.push(
      model.onDidChangeContent((_event) => {
        if (model.getValue() !== initialValue) {
          // make sure there were actual changes from the initial value
          evaluate();
        }
        initialValue = undefined; // from now on, consider all changes as new
      }).dispose
    );

    // evaluate initial
    evaluate();

    this.disposers.push(
      model.onWillDispose(() => {
        this.registeredModels.delete(model);
        const evaluator = this.evaluatorCache.get(model);
        if (evaluator) {
          evaluator.dispose();
          this.evaluatorCache.delete(model);
        }
      }).dispose
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("Engine already disposed");
    }
    this.disposed = true;
    this.disposers.forEach((d) => d());
    this.evaluatorCache.forEach((e) => e.dispose());
  }

  private evaluateUpdateSingleInitial = awaitFirst(
    this.evaluateUpdate.bind(this)
  );

  private async evaluateUpdate(
    model: monaco.editor.ITextModel,
    typecellContext: TypeCellContext,
    exposeGlobalVariables: { [key: string]: any },
    resolveImport: (module: string) => Promise<any>,
    onOutput: (model: monaco.editor.ITextModel, output: any) => void
  ) {
    if (!mainWorker) {
      mainWorker = await monaco.languages.typescript.getTypeScriptWorker();
    }

    if (!this.evaluatorCache.has(model)) {
      this.evaluatorCache.set(
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
    const evaluator = this.evaluatorCache.get(model)!;

    // const tscode = model.getValue();
    // const hsh = hash(tscode) + "";
    // const cached = localStorage.getItem(hsh);
    // if (cached) {
    // await evaluator.evaluate(cached);
    // } else {
    // console.log(model.uri, model.getValue());
    let code = (await getCompiledCode(mainWorker, model.uri)).firstJSCode;

    // localStorage.setItem(hsh, code);
    await evaluator.evaluate(code);
    // }
  }
}
