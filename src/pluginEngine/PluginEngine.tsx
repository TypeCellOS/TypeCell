import { observable, runInAction } from "mobx";
import * as monaco from "monaco-editor";
import { Engine } from "../engine";
import getExposeGlobalVariables from "./lib/exports";

let ENGINE_ID = 0;
export default class PluginEngine {
  private disposed: boolean = false;

  public readonly engine: Engine;
  public readonly id = ENGINE_ID++;

  private preRunDisposers: Array<() => void> = [];
  // TODO: do we want this for pluginengine?
  public readonly outputs = observable.map<monaco.editor.ITextModel, any>(
    undefined,
    { deep: false }
  );

  constructor(private documentId: string) {
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
            default: getExposeGlobalVariables(this.documentId, (disposer) =>
              this.preRunDisposers.push(disposer)
            ),
          };
        }
      } // no support for imports
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("PluginEngine already disposed");
    }
    this.disposed = true;
    this.engine.dispose();
  }
}
