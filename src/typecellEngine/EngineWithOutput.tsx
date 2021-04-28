import {
  autorun,
  computed,
  makeObservable,
  observable,
  ObservableMap,
  runInAction,
} from "mobx";
import { Engine } from "../engine";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import getExposeGlobalVariables, { TypeVisualizer } from "./lib/exports";
import { ModelOutput } from "./ModelOutput";
import resolveImport from "./resolver";
import { TypeChecker } from "./TypeChecker";

let ENGINE_ID = 0;
export default class EngineWithOutput {
  private readonly disposers = new Set<() => void>();
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
  public readonly typechecker: TypeChecker;
  constructor(
    private readonly documentId: string,
    private readonly needsTypesInMonaco: boolean
  ) {
    this.typechecker = new TypeChecker(documentId);
    // console.log(this.id, documentId);
    this.engine = new Engine(
      (model, output) => {
        let modelOutput = this.outputs.get(model);
        if (!modelOutput) {
          modelOutput = new ModelOutput(model, this);
          this.outputs.set(model, modelOutput);
        }
        modelOutput.updateValue(output);
      },
      (model) => {
        // this.preRunDisposers.get(model)?.forEach((d) => d());
        // this.preRunDisposers.set(model, []);
      },
      this.resolveImport
    );

    const dispose = autorun(() => {
      const toSet: string[] = [];
      const toDelete: string[] = [];
      const ctx = this.engine.observableContext.context;
      for (let obj in ctx) {
        if (ctx[obj] instanceof TypeVisualizer) {
          toSet.push(obj);
        }
      }
      this.availableVisualizers.forEach((el, key) => {
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
    this.disposers.add(dispose);
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
    this.disposers.add(resolved.dispose);
    return resolved.module;
  };

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;
    this.engine.dispose();
    this.disposers.forEach((d) => d());
  }
}
