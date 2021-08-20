import { autorun, observable, ObservableMap, runInAction } from "mobx";
import Output from "../documentRenderers/notebook/Output";
import { Engine } from "../engine";
import { CodeModel } from "../engine/CodeModel";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { Disposable } from "../util/vscode-common/lifecycle";
import { TypeVisualizer } from "./lib/exports";
import { ModelOutput } from "./ModelOutput";
import { getTypeCellResolver } from "./resolver";
import { TypeChecker } from "./TypeChecker";

let ENGINE_ID = 0;
export default class EngineWithOutput extends Disposable {
  private disposed: boolean = false;

  // TODO: maybe observable map is not necessary / we can easily remove mobx dependency here
  public readonly outputs = observable.map<TypeCellCodeModel, ModelOutput>(
    undefined,
    {
      deep: false,
    }
  );

  public readonly availableVisualizers = new ObservableMap<
    string,
    TypeVisualizer<any>
  >();
  private readonly engine: Engine<TypeCellCodeModel>;
  public readonly id = ENGINE_ID++;
  // private preRunDisposers = new Map<TypeCellCodeModel, Array<() => void>>();
  public readonly typechecker: TypeChecker | undefined;

  public registerModel(model: TypeCellCodeModel) {
    return this.engine.registerModel(model);
  }

  constructor(
    private readonly documentId: string,
    private readonly needsTypesInMonaco: boolean
  ) {
    super();
    if (needsTypesInMonaco) {
      // only use typechecker when enginewithoutput is used in notebookcells etc
      this.typechecker = this._register(
        new TypeChecker(this.id + "", documentId)
      );
    }
    this.engine = new Engine(
      (model, output) => {
        let modelOutput = this.outputs.get(model);
        if (!modelOutput) {
          modelOutput = this._register(
            new ModelOutput(
              model,
              this.typechecker
                ? {
                    typechecker: this.typechecker,
                    availableVisualizers: this.availableVisualizers,
                  }
                : undefined
            )
          );
          this.outputs.set(model, modelOutput);
        }
        modelOutput.updateValue(output);
      },
      (model) => {},
      getTypeCellResolver(documentId, "EWO" + this.id, needsTypesInMonaco)
    );

    // Generate a mobx map from TypeVisualizers on observableContext.
    // TODO: Maybe we can use mobx-utils ObservableGroupMap for this?
    const dispose = autorun(() => {
      const toSet: string[] = [];
      const toDelete: string[] = [];
      const ctx = this.engine.observableContext.context;
      for (let obj in ctx) {
        if (ctx[obj] instanceof TypeVisualizer) {
          toSet.push(obj);
        }
      }
      this.availableVisualizers.forEach((_el, key) => {
        if (!ctx[key]) {
          toDelete.push(key);
        }
      });
      runInAction(() => {
        toSet.forEach((key) => {
          this.availableVisualizers.set(key, ctx[key]);
        });
        toDelete.forEach((key) => {
          this.availableVisualizers.delete(key);
        });
      });
    });
    this._register({ dispose });
  }

  public renderContainer() {
    return <></>;
  }

  public renderOutput(model: TypeCellCodeModel) {
    return (
      <div style={{ padding: "10px" }}>
        <Output outputs={this.outputs} model={model} />
      </div>
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;
    this.engine.dispose();
    super.dispose();
  }
}
