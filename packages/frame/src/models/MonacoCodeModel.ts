import * as monaco from "monaco-editor";
import { event, lifecycle } from "vscode-lib";

import { CodeModel } from "@typecell-org/engine";

export class MonacoTypeCellCodeModel
  extends lifecycle.Disposable
  implements CodeModel
{
  private readonly _onWillDispose: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onWillDispose: event.Event<void> = this._onWillDispose.event;

  private readonly _onDidChangeContent: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onDidChangeContent: event.Event<void> =
    this._onDidChangeContent.event;

  constructor(private readonly monacoModel: monaco.editor.ITextModel) {
    super();
    this._register(
      monacoModel.onDidChangeContent(() => {
        this._onDidChangeContent.fire();
      })
    );

    this._register(
      monacoModel.onWillDispose(() => {
        this._onWillDispose.fire();
      })
    );
  }

  public get path() {
    return this.monacoModel.uri.toString();
  }

  public get language() {
    // TODO: what if language changes?
    return this.monacoModel.getLanguageId();
  }

  public getValue() {
    return this.monacoModel.getValue();
  }
}
