import _ from "lodash";
import { lifecycle, event } from "vscode-lib";
import { createCellEvaluator } from "./CellEvaluator";
import { CodeModel } from "./CodeModel";
import { createContext, TypeCellContext } from "./context";

export type ResolvedImport = {
  module: any;
} & lifecycle.IDisposable;

export type OutputEvent<T> = {
  model: T;
  output: any;
};

export type ConsolePayload = {
  level: "info" | "warn" | "error" | "clear";
  arguments: any[];
};

export type ConsoleEvent<T> = {
  model: T;
  payload: ConsolePayload;
};

/**
 * The engine automatically runs models registered to it.
 * The code of the models is passed a context ($) provided by the engine.
 * This context is how the code of different models can react to each other.
 *
 * @export
 * @class Engine
 */
export class Engine<T extends CodeModel> extends lifecycle.Disposable {
  private disposed = false;
  public readonly observableContext = createContext<any>({} as any);
  private readonly registeredModels = new Set<T>();

  private readonly evaluatorCache = new Map<
    T,
    ReturnType<typeof createCellEvaluator>
  >();

  private readonly _onOutput: event.Emitter<OutputEvent<T>> = this._register(
    new event.Emitter<OutputEvent<T>>()
  );

  private readonly _onConsole: event.Emitter<ConsoleEvent<T>> = this._register(
    new event.Emitter<ConsoleEvent<T>>()
  );

  /**
   * Raised whenever a model is (re)evaluated, with the exports by that model
   *
   * @type {event.Event<OutputEvent<T>>}
   * @memberof Engine
   */
  public readonly onOutput: event.Event<OutputEvent<T>> = this._onOutput.event;

  /**
   * Raised whenever a model calls console.* functions
   *
   * @type {event.Event<ConsoleEvent<T>>}
   * @memberof Engine
   */
  public readonly onConsole: event.Event<ConsoleEvent<T>> =
    this._onConsole.event;

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
    ) => Promise<ResolvedImport>,
    private debounceMillis = 100
  ) {
    super();
  }

  public registerModelProvider(provider: {
    onDidCreateCompiledModel: event.Event<T>;
    compiledModels: T[];
  }) {
    provider.compiledModels.forEach((m) => this.registerModel(m));
    this._register(
      provider.onDidCreateCompiledModel((m) => {
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
          this._register(ret);
          if (this.disposed) {
            // disposed in the meantime
            ret.dispose();
          }
          return ret.module;
        },
        (event) => this._onOutput.fire(event),
        (event) => this._onConsole.fire(event)
      ); // catch errors?
    };
    let prevValue: string | undefined = model.getValue();

    // TODO: maybe only debounce (or increase debounce timeout) if an execution is still pending?
    const reEvaluate = _.debounce(() => {
      // make sure there were actual changes from the previous value
      if (model.getValue() !== prevValue) {
        // Clear the console upon re-evaluation
        this._onConsole.fire({
          model,
          payload: {
            level: "clear",
            arguments: [],
          },
        });

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
    onOutput: (event: OutputEvent<T>) => void,
    onConsole: (event: ConsoleEvent<T>) => void
  ) {
    if (!this.evaluatorCache.has(model)) {
      this.evaluatorCache.set(
        model,
        createCellEvaluator(
          typecellContext,
          resolveImport,
          true,
          (output) => onOutput({ model, output }),
          (console) => onConsole({ model, payload: console }),
          () => this._onBeforeExecution.fire({ model })
        )
      );
    }
    const evaluator = this.evaluatorCache.get(model)!;
    if (model.language !== "javascript") {
      throw new Error("can not evaluate non-javascript code");
    }
    let code = model.getValue();
    console.log("evaluating", code);
    await evaluator.evaluate(code);
  }
}
