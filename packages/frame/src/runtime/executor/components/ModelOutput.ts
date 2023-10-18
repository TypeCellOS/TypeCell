/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, makeObservable, observable, runInAction } from "mobx";
import { lifecycle } from "vscode-lib";
import { TypeVisualizer } from "../lib/exports";
// import {
//   findMatchingVisualizers,
//   TypeChecker,
// } from "../sandbox/languages/typescript/reflection/TypeChecker";

export class ModelOutput extends lifecycle.Disposable {
  private autorunDisposer: (() => void) | undefined;

  public value: any = undefined;
  public _defaultValue = {
    value: {} as any,
  };
  public typeVisualizers = observable.map<
    string,
    {
      get visualizer(): TypeVisualizer<any> | undefined;
    }
  >();

  constructor(private context: any) {
    super();

    makeObservable(this, {
      typeVisualizers: observable.ref,
      value: observable.ref,
      _defaultValue: observable,
      defaultValue: computed.struct,
    });
  }

  get defaultValue() {
    return this._defaultValue;
  }

  /**
   * All keys except "default" are getters that retrieve the value from the main context, so we don't need
   * to update them, as the value on the default context has already been updated.
   *
   * However, the "default" value is not available on the context, so we need to update it manually.
   * We cache this via a computed mobx value in this.defaultValue
   *
   * TODO: maybe streamline this code with typecell-org/engine, and make other properties than default "computed" as well
   */
  async updateValue(newValue: any) {
    runInAction(() => {
      if (!this.value) {
        this.value = {};
      }
      // this.value = newValue;
      // return;
      if (newValue instanceof Error) {
        this.value = newValue;
        return;
      }
      let changed = false;
      const oldKeys = Object.getOwnPropertyNames(this.value);
      const newKeys = Object.getOwnPropertyNames(newValue);

      for (const key of newKeys) {
        if (!oldKeys.includes(key)) {
          // this.value[key] = newValue[key];
          changed = true;
        }
      }
      for (const key of oldKeys) {
        if (!newKeys.includes(key)) {
          // delete this.value[key];
          changed = true;
        }
      }

      // hacky nesting to make sure our customAnnotation (for react elements) is used
      this._defaultValue = { value: newValue.default };

      if (changed) {
        if (Object.hasOwn(newValue, "default")) {
          Object.defineProperty(newValue, "default", {
            get: () => {
              return this.defaultValue.value;
            },
          });
        }
        this.value = newValue;
      }
    });
  }

  async updateVisualizers(newValue: string[]) {
    for (const key of this.typeVisualizers.keys()) {
      if (!newValue.includes(key)) {
        this.typeVisualizers.delete(key);
      }
    }

    for (const key of newValue) {
      if (!this.typeVisualizers.has(key)) {
        const ctx = this.context;
        this.typeVisualizers.set(
          key,
          observable({
            get visualizer() {
              return ctx[key];
            },
          }),
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
