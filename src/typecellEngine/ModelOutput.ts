import { autorun, makeObservable, observable, runInAction } from "mobx";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { Disposable } from "../util/vscode-common/lifecycle";
import EngineWithOutput from "./EngineWithOutput";

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
        this.typeVisualizers = visualizers;
      });
    });
  }
  value: any;
  typeVisualizers: any;

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
