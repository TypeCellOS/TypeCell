import { IDisposable } from "../util/vscode-common/lifecycle";
import { Disposable } from "../util/vscode-common/lifecycle";
import { createCellEvaluator } from "./CellEvaluator";
import { CodeModel } from "./CodeModel";
import { createContext, TypeCellContext } from "./context";

export type ResolvedImport = {
  module: any;
} & IDisposable;

/**
 * The engine automatically runs models registered to it.
 * The code of the models is passed a context ($) provided by the engine.
 * This context is how the code of different models can react to each other.
 *
 * @export
 * @class Engine
 */
export class Engine<T extends CodeModel> extends Disposable {
  private disposed = false;
  public readonly observableContext = createContext<any>({} as any);
  private readonly registeredModels = new Set<T>();

  private readonly evaluatorCache = new Map<
    T,
    ReturnType<typeof createCellEvaluator>
  >();
  /**
   *
   * @param onOutput Called whenever a model is reevaluated, with the exports by that model
   * @param exposeGlobalVariables A Map of global variables passed to the execution of models
   * @param resolveImport Function (resolver) to resolve imports
   */
  constructor(
    private onOutput: (model: T, output: any) => void,
    private beforeExecuting: (model: T) => void,
    private resolveImport: (
      module: string,
      forModel: T
    ) => Promise<ResolvedImport>
  ) {
    super();
  }

  /**
   * Register a model to the engine. After registering, the model will be observed for changes and automatically re-evaluated.
   *
   * When the model is disposed (model.dispose()), the model is automatically unregistered.
   * @param model model to register
   */
  public registerModel(model: T) {
    if (this.disposed) {
      throw new Error("registering model on disposed engine");
    }
    if (this.registeredModels.has(model)) {
      console.warn("model already registered"); // TODO: shouldn't happen
      return;
    }
    this.registeredModels.add(model);
    const evaluate = () => {
      this.evaluateUpdate(
        model,
        this.observableContext,
        async (moduleName: string) => {
          const ret = await this.resolveImport(moduleName, model);
          this._register(ret);
          if (this.disposed) {
            // disposed in the meantime
            ret.dispose();
          }
          return ret.module;
        },
        this.onOutput
      ); // catch errors?
    };
    let prevValue: string | undefined = model.getValue();

    this._register(
      model.onDidChangeContent((_event) => {
        if (model.getValue() !== prevValue) {
          // make sure there were actual changes from the previous value

          prevValue = model.getValue();
          evaluate();
        } else {
          // TODO: inspect when this is the case. For initialization it makes sense,
          // but why do we get duplicate events more often?
        }
      })
    );

    // evaluate initial
    evaluate();

    this._register(
      model.onWillDispose(() => {
        this.registeredModels.delete(model);
        const evaluator = this.evaluatorCache.get(model);
        if (evaluator) {
          evaluator.dispose();
          this.evaluatorCache.delete(model);
        }
      })
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("Engine already disposed");
    }
    this.disposed = true;

    super.dispose();
    this.evaluatorCache.forEach((e) => e.dispose());
  }

  private async evaluateUpdate(
    model: T,
    typecellContext: TypeCellContext<any>,
    resolveImport: (module: string) => Promise<any>,
    onOutput: (model: T, output: any) => void
  ) {
    if (!this.evaluatorCache.has(model)) {
      this.evaluatorCache.set(
        model,
        createCellEvaluator(
          typecellContext,
          resolveImport,
          true,
          (output) => onOutput(model, output),
          () => this.beforeExecuting(model)
        )
      );
    }
    const evaluator = this.evaluatorCache.get(model)!;
    let code = await model.getCompiledJavascriptCode();
    await evaluator.evaluate(code);
  }
}
