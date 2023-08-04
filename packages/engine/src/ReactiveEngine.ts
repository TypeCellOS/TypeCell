/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from "lodash";
import { event, lifecycle } from "vscode-lib";
import { createCellEvaluator } from "./CellEvaluator.js";
import { CodeModel } from "./CodeModel.js";
import { TypeCellContext, createContext } from "./context.js";

export type ResolvedImport = {
  module: unknown;
} & lifecycle.IDisposable;

/**
 * The ReactiveEngine automatically runs models registered to it.
 * The code of the models is passed a context ($) provided by the engine.
 * This context is how the code of different models can react to each other.
 *
 * @export
 * @class ReactiveEngine
 */
export class ReactiveEngine<T extends CodeModel> extends lifecycle.Disposable {
  private disposed = false;
  public readonly observableContext = createContext<unknown>();
  private readonly registeredModels = new Set<T>();

  private readonly evaluatorCache = new Map<
    T,
    ReturnType<typeof createCellEvaluator>
  >();

  private readonly _onOutput: event.Emitter<{ model: T; output: any }> =
    this._register(new event.Emitter<{ model: T; output: any }>());

  /**
   * Raised whenever a model is (re)evaluated, with the exports by that model
   *
   * @type {event.Event<{ model: T; output: any }>}
   * @memberof Engine
   */
  public readonly onOutput: event.Event<{ model: T; output: any }> =
    this._onOutput.event;

  private readonly _onBeforeExecution: event.Emitter<{ model: T }> =
    this._register(new event.Emitter<{ model: T }>());

  /**
   * Raised before (re)evaluating a model
   *
   * @type {event.Event<{ model: T }>}
   * @memberof Engine
   */
  public readonly onBeforeExecution: event.Event<{ model: T }> =
    this._onBeforeExecution.event;

  /**
   * @param resolveImport Function (resolver) to resolve imports
   */
  constructor(
    private resolveImport: (
      module: string,
      forModel: T
    ) => Promise<ResolvedImport | undefined>,
    private debounceMillis = 100
  ) {
    super();
  }

  public registerModelProvider(compiledModelProvider: {
    onDidCreateModel: event.Event<T>;
    models: T[];
  }) {
    compiledModelProvider.models.forEach((m) => this.registerModel(m));
    this._register(
      compiledModelProvider.onDidCreateModel((m) => {
        this.registerModel(m);
      })
    );
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
          if (!ret) {
            throw new Error(`Could not resolve import ${moduleName}`);
          }
          this._register(ret);
          if (this.disposed) {
            // disposed in the meantime
            ret.dispose();
          }
          return ret.module;
        },
        (model, output) => this._onOutput.fire({ model, output })
      ); // catch errors?
    };
    let prevValue: string | undefined = model.getValue();

    // TODO: maybe only debounce (or increase debounce timeout) if an execution is still pending?
    const reEvaluate = _.debounce(() => {
      if (model.getValue() !== prevValue) {
        // make sure there were actual changes from the previous value

        prevValue = model.getValue();
        evaluate();
      } else {
        // TODO: inspect when this is the case. For initialization it makes sense,
        // but why do we get duplicate events more often?
      }
    }, this.debounceMillis);

    this._register(model.onDidChangeContent(reEvaluate));

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
          () => this._onBeforeExecution.fire({ model })
        )
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const evaluator = this.evaluatorCache.get(model)!;
    if (model.language !== "javascript") {
      throw new Error("can not evaluate non-javascript code");
    }
    const code = model.getValue();
    console.log("evaluating", code);
    await evaluator.evaluate(code);
  }
}
