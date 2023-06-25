import { Engine } from "@typecell-org/engine";
import { observable } from "mobx";
import type * as monaco from "monaco-editor";
import { lifecycle } from "vscode-lib";
import { CompiledCodeModel } from "../../../../models/CompiledCodeModel";
import { SessionStore } from "../../../../store/local/SessionStore";
import SourceModelCompiler from "../../../compiler/SourceModelCompiler";
import { VisualizerExtension } from "../../../extensions/visualizer/VisualizerExtension";
import { ModelOutput } from "../../components/ModelOutput";
import Output from "../../components/Output";
import { getTypeCellResolver } from "../../resolver/resolver";
import { TypeCellModuleCompiler } from "../../resolver/typecell/TypeCellModuleCompiler";
import { ExecutionHost } from "../ExecutionHost";

let ENGINE_ID = 0;

export default class LocalExecutionHost
  extends lifecycle.Disposable
  implements ExecutionHost
{
  private disposed: boolean = false;

  private readonly outputs = observable.map<string, ModelOutput>(undefined, {
    deep: false,
  });

  private readonly engine: Engine<CompiledCodeModel>;
  private readonly id = ENGINE_ID++;

  constructor(
    private readonly documentId: string,
    compileEngine: SourceModelCompiler,
    monacoInstance: typeof monaco,
    sessionStore: SessionStore
  ) {
    super();
    this.engine = new Engine(
      getTypeCellResolver(documentId, "LEH-" + this.id, (moduleName) => {
        return new TypeCellModuleCompiler(
          moduleName,
          monacoInstance,
          sessionStore
        );
      })
    );
    this.engine.registerModelProvider(compileEngine);

    const visualizerExtension = this._register(
      new VisualizerExtension(compileEngine, documentId, monacoInstance)
    );

    this._register(
      visualizerExtension.onUpdateVisualizers((e) => {
        for (let [path, visualizers] of Object.entries(e)) {
          this.outputs.get(path)!.updateVisualizers(visualizers);
        }
      })
    );

    this._register(
      this.engine.onOutput(({ model, output }) => {
        let modelOutput = this.outputs.get(model.path);
        if (!modelOutput) {
          modelOutput = this._register(
            new ModelOutput(this.engine.observableContext.context)
          );
          this.outputs.set(model.path, modelOutput);
        }
        modelOutput.updateValue(output);
      })
    );
  }

  public renderContainer() {
    return <></>;
  }

  public renderOutput(modelPath: string) {
    return (
      <div style={{ padding: "10px" }}>
        <Output outputs={this.outputs} modelPath={modelPath} />
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
