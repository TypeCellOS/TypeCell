import { CodeModel } from "@typecell-org/engine";

import type * as monaco from "monaco-editor";
import { async, lifecycle } from "vscode-lib";

type WorkerType = (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

export class TypeChecker extends lifecycle.Disposable {
  private worker: WorkerType | undefined;
  private readonly model: monaco.editor.ITextModel;
  private queue = new async.Sequencer();

  constructor(
    private readonly documentId: string,
    private readonly monacoInstance: typeof monaco
  ) {
    super();
    const uri = monacoInstance.Uri.file(
      `/typecell/typechecker/${documentId}/typechecker.ts`
    );

    this.model = monacoInstance.editor.getModel(uri)!;

    if (this.model) {
      //throw new Error("unexpected, TypeChecker model already exists");
      return;
    }

    this.model = this._register(
      monacoInstance.editor.createModel("", "typescript", uri)
    );
  }

  public findMatchingVisualizers(module: CodeModel) {
    return this.queue.queue(() => this._findMatchingVisualizers(module));
  }

  private async _findMatchingVisualizers(module: CodeModel) {
    return [];
  }
}
