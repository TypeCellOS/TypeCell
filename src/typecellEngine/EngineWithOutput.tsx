import { observable } from "mobx";
import * as monaco from "monaco-editor";
import { Engine } from "../engine";
import { getExposeGlobalVariables } from "./lib/exports";
import resolveImport from "./resolver";

let ENGINE_ID = 0;
export default class EngineWithOutput {
  private readonly disposers = new Set<() => void>();
  private disposed: boolean = false;

  // TODO: maybe observable map is not necessary / we can easily remove mobx dependency here
  public readonly outputs = observable.map<monaco.editor.ITextModel, any>(
    undefined,
    { deep: false }
  );
  public readonly engine: Engine;
  public readonly id = ENGINE_ID++;
  constructor(private documentId: string) {
    // console.log(this.id, documentId);
    this.engine = new Engine((model, output) => {
      this.outputs.set(model, output);
    }, this.resolveImport);
  }

  private resolveImport = async (
    module: string,
    forModel: monaco.editor.ITextModel
  ) => {
    if (this.disposed) {
      throw new Error(
        "EngineWithOutput already disposed (resolveImport called)"
      );
    }
    if (module === "typecell") {
      return getExposeGlobalVariables(this.documentId);
    }
    const resolved = await resolveImport(module, forModel, this);
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
