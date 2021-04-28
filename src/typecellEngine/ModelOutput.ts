import { autorun, makeObservable, observable, runInAction } from "mobx";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { Disposable } from "../util/vscode-common/lifecycle";
import EngineWithOutput from "./EngineWithOutput";
import { TypeVisualizer } from "./lib/exports";

export class ModelOutput extends Disposable {
  private autorunDisposer: (() => void) | undefined;
  constructor(
    private model: TypeCellCodeModel,
    private engine: EngineWithOutput
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
    const tc = this.engine.typechecker;
    if (!tc) {
      runInAction(() => {
        this.value = newValue;
        this.typeVisualizers = [];
      });
      return;
    }
    this.autorunDisposer = autorun(async () => {
      const visualizers = await tc.findMatchingVisualizers(
        this.model,
        this.engine.availableVisualizers
      );
      runInAction(() => {
        this.value = newValue;
        this.typeVisualizers = visualizers.map(
          (v) => this.engine.availableVisualizers.get(v)!
        );
      });
    });
  }
  value: any;
  typeVisualizers: TypeVisualizer<any>[] = [];

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
