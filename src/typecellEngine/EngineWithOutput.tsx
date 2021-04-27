import { observable, runInAction } from "mobx";
import { Engine } from "../engine";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import getExposeGlobalVariables from "./lib/exports";
import resolveImport from "./resolver";

let ENGINE_ID = 0;
export default class EngineWithOutput {
  private readonly disposers = new Set<() => void>();
  private disposed: boolean = false;

  // TODO: maybe observable map is not necessary / we can easily remove mobx dependency here
  public readonly outputs = observable.map<TypeCellCodeModel, any>(undefined, {
    deep: false,
  });
  public readonly engine: Engine<TypeCellCodeModel>;
  public readonly id = ENGINE_ID++;
  constructor(
    private readonly documentId: string,
    private readonly needsTypesInMonaco: boolean
  ) {
    // console.log(this.id, documentId);
    this.engine = new Engine(
      (model, output) => {
        runInAction(() => this.outputs.set(model, output));
      },
      () => {},
      this.resolveImport
    );
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
      return { default: getExposeGlobalVariables(this.documentId) };
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
