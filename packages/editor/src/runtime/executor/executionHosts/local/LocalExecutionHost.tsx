import { Engine } from "@typecell-org/engine";
import { observable } from "mobx";
import type * as monaco from "monaco-editor";
import { lifecycle } from "vscode-lib";
import Output from "../../components/Output";
import { CompiledCodeModel } from "../../../../models/CompiledCodeModel";
import { TypeCellCodeModel } from "../../../../models/TypeCellCodeModel";
import { ModelOutput } from "../../components/ModelOutput";
import { getTypeCellResolver } from "../../resolver/resolver";
import { ExecutionHost } from "../ExecutionHost";
import SourceModelCompiler from "../../../compiler/SourceModelCompiler";
import { TypeCellModuleCompiler } from "../../resolver/typecell/TypeCellModuleCompiler";
import { VisualizerExtension } from "../../../extensions/visualizer/VisualizerExtension";

let ENGINE_ID = 0;
export default class LocalExecutionHost extends lifecycle.Disposable implements ExecutionHost {
  private disposed: boolean = false;

  // TODO: maybe observable map is not necessary / we can easily remove mobx dependency here
  private readonly outputs = observable.map<string, ModelOutput>(
    undefined,
    {
      deep: false,
    }
  );

  private readonly engine: Engine<CompiledCodeModel>;
  private readonly id = ENGINE_ID++;

  constructor(
    private readonly documentId: string,
    compileEngine: SourceModelCompiler,
    monacoInstance: typeof monaco
  ) {
    super();
    this.engine = new Engine(
      getTypeCellResolver(documentId, "LEH-" + this.id, (moduleName) => {
        return new TypeCellModuleCompiler(moduleName, monacoInstance)
      })
    );
    this.engine.registerModelProvider(compileEngine);

    const visualizerExtension = this._register(new VisualizerExtension(compileEngine, documentId, monacoInstance));

    this._register(visualizerExtension.onUpdateVisualizers(e => {
      for (let [path, visualizers] of Object.entries(e)) {
        this.outputs.get(path)!.updateVisualizers(visualizers);
      }
    }));

    this._register(
      this.engine.onOutput(({ model, output }) => {
        let modelOutput = this.outputs.get(model.path);
        if (!modelOutput) {
          modelOutput = this._register(
            new ModelOutput(
              this.engine.observableContext.context
            )
          );
          this.outputs.set(model.path, modelOutput);
        }
        modelOutput.updateValue(output);
      }));
  }

  public renderContainer() {
    return <></>;
  }

  public renderOutput(model: TypeCellCodeModel) {
    return (
      <div style={{ padding: "10px" }}>
        <Output outputs={this.outputs} modelPath={model.path} />
      </div>
    );
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("EngineWithOutput already disposed");
    }
    this.disposed = true;
    this.engine.dispose();
    super.dispose();
  }
}
