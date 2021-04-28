import {
  autorun,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import EngineWithOutput from "./EngineWithOutput";

export class ModelOutput {
  private autorunDisposer: (() => void) | undefined;
  constructor(
    private model: TypeCellCodeModel,
    private engine: EngineWithOutput
  ) {
    makeObservable(this, {
      typeVisualizers: observable.ref,
      value: observable.ref,
    });
  }

  async updateValue(newValue: any) {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    console.log("updateValue");
    // const val = value;
    this.autorunDisposer = autorun(async () => {
      const visualizers = await this.engine.typechecker.findMatchingVisualizers(
        this.model,
        this.engine.availableVisualizers
      );
      runInAction(() => {
        console.log("set");
        this.value = newValue;
        this.typeVisualizers = visualizers;
      });
    });
  }
  value: any;
  typeVisualizers: any;
}
