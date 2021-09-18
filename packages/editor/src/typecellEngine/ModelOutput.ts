import { CodeModel } from "@typecell-org/engine";
import {
  autorun,
  makeObservable,
  observable,
  ObservableMap,
  runInAction,
} from "mobx";
import { lifecycle } from "vscode-lib";
import { TypeVisualizer } from "./lib/exports";
import { TypeChecker } from "./TypeChecker";

export class ModelOutput extends lifecycle.Disposable {
  private autorunDisposer: (() => void) | undefined;
  public value: any;
  public typeVisualizers: TypeVisualizer<any>[] = [];

  constructor(
    private readonly model: CodeModel,
    private readonly typeCheckerProvider?: {
      typechecker: TypeChecker;
      availableVisualizers: ObservableMap<string, TypeVisualizer<any>>;
    }
  ) {
    super();
    makeObservable(this, {
      typeVisualizers: observable.ref,
      value: observable.ref,
    });
  }

  async updateValue(newValue: any) {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    const tc = this.typeCheckerProvider?.typechecker;
    if (!tc) {
      runInAction(() => {
        this.value = newValue;
        this.typeVisualizers = [];
      });
      return;
    } else {
      this.autorunDisposer = autorun(async () => {
        const visualizers = await tc.findMatchingVisualizers(
          this.model,
          this.typeCheckerProvider!.availableVisualizers
        );
        runInAction(() => {
          this.value = newValue;
          this.typeVisualizers = visualizers.map(
            (v) => this.typeCheckerProvider!.availableVisualizers.get(v)!
          );
        });
      });
    }
  }

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
