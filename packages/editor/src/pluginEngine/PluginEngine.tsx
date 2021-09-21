import { observable } from "mobx";
import Output from "../documentRenderers/notebook/Output";
import { Engine } from "@typecell-org/engine";
import {
  getTypeCellCodeModel,
  TypeCellCodeModel,
} from "../models/TypeCellCodeModel";
import PluginResource from "../store/PluginResource";
import { lifecycle } from "vscode-lib";
import getExposeGlobalVariables from "./lib/exports";
import type * as monaco from "monaco-editor";

let ENGINE_ID = 0;
export default class PluginEngine extends lifecycle.Disposable {
  private disposed: boolean = false;

  private readonly engine: Engine<TypeCellCodeModel>;
  public readonly id = ENGINE_ID++;

  private preRunDisposers: Array<() => void> = [];
  // TODO: do we want this for pluginengine?
  public readonly outputs = observable.map<TypeCellCodeModel, any>(undefined, {
    deep: false,
  });

  public registerModel(model: TypeCellCodeModel) {
    return this.engine.registerModel(model);
  }

  constructor(private plugin: PluginResource, monacoInstance: typeof monaco) {
    super();
    // console.log(this.id, documentId);
    this.engine = new Engine(
      async (module) => {
        if (module === "typecell-plugin") {
          return {
            dispose: () => {
              // TODO
            },
            module: getExposeGlobalVariables(this.plugin.id, (disposer) =>
              this.preRunDisposers.push(disposer)
            ),
          };
        }
        throw new Error("not supported import");
      } // no support for imports
    );

    this._register(this.engine.onBeforeExecution(e => {
      this.preRunDisposers.forEach((d) => d());
      this.preRunDisposers = [];
    }))

    const model = this._register(getTypeCellCodeModel(plugin.pluginCell, monacoInstance));
    this.engine.registerModel(model.object);
  }

  public renderContainer() {
    return <></>;
  }

  public renderOutput(model: TypeCellCodeModel) {
    return <Output outputs={this.outputs} model={model} />;
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("PluginEngine already disposed");
    }
    this.disposed = true;
    super.dispose();
    this.engine.dispose();
  }
}
