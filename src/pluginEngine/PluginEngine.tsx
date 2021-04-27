import { observable } from "mobx";
import { Engine } from "../engine";
import {
  getTypeCellCodeModel,
  TypeCellCodeModel,
} from "../models/TypeCellCodeModel";
import PluginResource from "../store/PluginResource";
import { Disposable } from "../util/vscode-common/lifecycle";
import getExposeGlobalVariables from "./lib/exports";

let ENGINE_ID = 0;
export default class PluginEngine extends Disposable {
  private disposed: boolean = false;

  public readonly engine: Engine<TypeCellCodeModel>;
  public readonly id = ENGINE_ID++;

  private preRunDisposers: Array<() => void> = [];
  // TODO: do we want this for pluginengine?
  public readonly outputs = observable.map<TypeCellCodeModel, any>(undefined, {
    deep: false,
  });

  constructor(private plugin: PluginResource) {
    super();
    // console.log(this.id, documentId);
    this.engine = new Engine(
      (model, output) => {
        // TODO: currently errors end up here and are not displayed
      },
      (model) => {
        this.preRunDisposers.forEach((d) => d());
        this.preRunDisposers = [];
      },
      async (module) => {
        if (module === "typecell-plugin") {
          return {
            default: getExposeGlobalVariables(this.plugin.id, (disposer) =>
              this.preRunDisposers.push(disposer)
            ),
          };
        }
      } // no support for imports
    );
    const model = this._register(getTypeCellCodeModel(plugin.pluginCell));
    this.engine.registerModel(model.object);
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
