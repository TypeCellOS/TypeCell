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
// import {
//   findMatchingVisualizers,
//   TypeChecker,
// } from "../sandbox/languages/typescript/reflection/TypeChecker";

export class ModelOutput extends lifecycle.Disposable {
  private autorunDisposer: (() => void) | undefined;
  public value: any;
  public typeVisualizers: TypeVisualizer<any>[] = [];

  constructor(
    private readonly documentId: string,
    private readonly model: CodeModel
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
    // const tc = this.typeCheckerProvider?.typechecker;
    // if (!tc) {
    //   runInAction(() => {
    //     this.value = newValue;
    //     this.typeVisualizers = [];
    //   });
    //   return;
    // } else {
    this.autorunDisposer = autorun(async () => {
      let visualizers = []; /*await findMatchingVisualizers(
        this.documentId,
        this.model
      );
      visualizers = visualizers;
      debugger;*/
      runInAction(() => {
        this.value = newValue;
        // this.typeVisualizers = visualizers.map(
        //   (v) => this.typeCheckerProvider!.availableVisualizers.get(v)!
        // );
      });
    });
    // }
  }

  public dispose() {
    if (this.autorunDisposer) {
      this.autorunDisposer();
    }
    super.dispose();
  }
}
