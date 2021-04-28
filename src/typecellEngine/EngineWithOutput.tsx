import { autorun, observable, ObservableMap, runInAction } from "mobx";
import { Engine } from "../engine";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { Disposable } from "../util/vscode-common/lifecycle";
import getExposeGlobalVariables, { TypeVisualizer } from "./lib/exports";
import { ModelOutput } from "./ModelOutput";
import resolveImport from "./resolver";
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
  public readonly engine: Engine<TypeCellCodeModel>;
  public readonly id = ENGINE_ID++;
  // private preRunDisposers = new Map<TypeCellCodeModel, Array<() => void>>();
  public readonly typechecker: TypeChecker | undefined;
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
          modelOutput = this._register(new ModelOutput(model, this));
          this.outputs.set(model, modelOutput);
        }
        modelOutput.updateValue(output);
      },
      (model) => {},
      this.resolveImport
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

  private resolveImport = async (
    module: string,
    forModel: TypeCellCodeModel
  ) => {
    if (this.disposed) {
      throw new Error(
        "EngineWithOutput already disposed (resolveImport called)"
      );
    }
    if (module === "typecell") {
      return {
        default: getExposeGlobalVariables(this.documentId),
      };
    }
    const resolved = await resolveImport(
      module,
      forModel,
      this,
      this.needsTypesInMonaco
    );
    if (this.disposed) {
      resolved.dispose(); // engine has been disposed in the meantime
    }
    this._register(resolved);
    return resolved.module;
  };

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;
    this.engine.dispose();
    super.dispose();
  }
}
