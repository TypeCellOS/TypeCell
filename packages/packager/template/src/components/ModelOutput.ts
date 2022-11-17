import { makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
// import { TypeVisualizer } from "../lib/exports";
// import {
//   findMatchingVisualizers,
//   TypeChecker,
// } from "../sandbox/languages/typescript/reflection/TypeChecker";

export class ModelOutput extends lifecycle.Disposable {
  private autorunDisposer: (() => void) | undefined;
  public value: any = undefined;
  public typeVisualizers = observable.map<
    string,
    {
      get visualizer(): any | undefined;
    }
  >();

  constructor(private context: any) {
    super();
    makeObservable(this, {
      typeVisualizers: observable.ref,
      value: observable.ref,
    });
  }

  async updateValue(newValue: any) {
    runInAction(() => {
      this.value = newValue;
    });
  }

  async updateVisualizers(newValue: string[]) {
    for (let key of this.typeVisualizers.keys()) {
      if (!newValue.includes(key)) {
        this.typeVisualizers.delete(key);
      }
    }

    for (let key of newValue) {
      if (!this.typeVisualizers.has(key)) {
        const ctx = this.context;
        this.typeVisualizers.set(
          key,
          observable({
            get visualizer() {
              return ctx[key];
            },
          })
        );
      }
    }
    // this.autorunDisposer?.();
    // this.autorunDisposer = autorun(() => {
    //   const visualizers = newValue.map((visualizerKey) => {
    //     const visualizer = this.context[visualizerKey];
    //     if (!visualizer || !(visualizer instanceof TypeVisualizer)) {
    //       console.warn("visualizer with key not found", visualizerKey);
    //       return undefined;
    //     }
    //     return [visualizerKey, visualizer];
    //   });
    //   runInAction(() => {
    //     this.typeVisualizers = visualizers.filter(
    //       (v): v is TypeVisualizer<any> => !!v
    //     );
    //   });
    // });
  }

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
