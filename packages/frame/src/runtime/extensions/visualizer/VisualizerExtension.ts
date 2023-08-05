import { BasicCodeModel } from "@typecell-org/shared/src/codeModels/BasicCodeModel";
import type * as monaco from "monaco-editor";
import { event, lifecycle } from "vscode-lib";
import SourceModelCompiler from "../../compiler/SourceModelCompiler";
import { TypeChecker } from "./TypeChecker";

export type VisualizersByPath = { [key: string]: string[] };

export class VisualizerExtension extends lifecycle.Disposable {
  private readonly typeChecker: TypeChecker;

  private readonly _onUpdateVisualizers: event.Emitter<VisualizersByPath> =
    this._register(new event.Emitter<VisualizersByPath>());

  public readonly onUpdateVisualizers: event.Event<VisualizersByPath> =
    this._onUpdateVisualizers.event;

  constructor(
    private readonly compiler: SourceModelCompiler,
    private readonly documentId: string,
    private readonly monacoInstance: typeof monaco
  ) {
    super();
    this.typeChecker = new TypeChecker(this.documentId, this.monacoInstance);
    compiler.models.forEach((m) => this.registerModel(m));
    this._register(
      compiler.onDidCreateModel((m) => {
        this.registerModel(m);
        this.updateVisualizers();
      })
    );
    this.updateVisualizers();
  }

  private registerModel(model: BasicCodeModel) {
    this._register(
      model.onDidChangeContent(() => {
        this.updateVisualizers();
      })
    );
    this._register(
      model.onWillDispose(() => {
        this.updateVisualizers();
      })
    );
  }

  private async updateVisualizers() {
    const entries = await Promise.all(
      this.compiler.models.map(async (model) => {
        const visualizers = await this.typeChecker.findMatchingVisualizers(
          model
        );
        const entry: [string, string[]] = [model.path, visualizers];
        return entry;
      })
    );

    const visualizerMap = Object.fromEntries(entries);
    this._onUpdateVisualizers.fire(visualizerMap);
  }
}
