import { autorun } from "mobx";
import * as monaco from "monaco-editor";
import { TypeCellCodeModel } from "./TypeCellCodeModel";

/**
 * A CodeModel that bridges yjs and Monaco.
 * The model is added to the monaco runtime the first time acquireMonacoModel is called.
 * It's then kept in monaco until all references to TypeCellCodeModel are released.
 *
 * TypeCellCodeModel observes a Y.Text as source-of-truth
 */
export class MonacoTypeCellCodeModel extends TypeCellCodeModel {
  private readonly uri: monaco.Uri;

  constructor(private readonly monacoModel: monaco.editor.ITextModel) {
    // TODO: language like this ok?
    super(monacoModel.uri.toString(), monacoModel.getLanguageId());
    const dispose = autorun(() => {
      this._onDidChangeContent.fire();
    });
    this._register({
      dispose,
    });

    this._register(
      monacoModel.onDidChangeContent(() => {
        this._onDidChangeContent.fire();
      })
    );

    this.uri = monacoModel.uri;
  }

  public getValue() {
    return this.monacoModel.getValue();
  }

  public acquireMonacoModel() {
    return this.monacoModel;
  }

  public releaseMonacoModel() {}

  public dispose() {
    super.dispose();
  }
}
