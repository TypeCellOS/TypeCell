import { autorun, untracked } from "mobx";
import type * as monaco from "monaco-editor";
import { event, lifecycle } from "vscode-lib";
import * as Y from "yjs";
import { NotebookCellModel } from "../app/documentRenderers/notebook/NotebookCellModel";

/**
 * A CodeModel that bridges yjs and Monaco.
 * The model is added to the monaco runtime the first time acquireMonacoModel is called.
 * It's then kept in monaco until all references to TypeCellCodeModel are released.
 *
 * TypeCellCodeModel observes a Y.Text as source-of-truth
 */
export class TypeCellCodeModel extends lifecycle.Disposable {
  private readonly uri: monaco.Uri;

  constructor(
    public readonly path: string,
    public readonly language: string,
    private readonly codeText: Y.Text,
    private monacoInstance: typeof monaco
  ) {
    super();
    const dispose = autorun(() => {
      this.codeText.toString(); // tracked by mobx
      this._onDidChangeContent.fire();
    });
    this._register({
      dispose,
    });
    this.uri = this.monacoInstance.Uri.file(path);
  }

  public getValue() {
    return untracked(() => this.codeText.toString());
  }

  private readonly _onWillDispose: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onWillDispose: event.Event<void> = this._onWillDispose.event;

  private readonly _onDidChangeContent: event.Emitter<void> = this._register(
    new event.Emitter<void>()
  );
  public readonly onDidChangeContent: event.Event<void> =
    this._onDidChangeContent.event;

  private monacoModelListener: lifecycle.IDisposable | undefined;
  private monacoModelReferences = 0;
  private monacoModel: monaco.editor.ITextModel | undefined;

  public acquireMonacoModel() {
    this.monacoModelReferences++;
    if (!this.monacoModel) {
      this.monacoModel =
        this.monacoInstance.editor.getModel(this.uri) || undefined;
      if (this.monacoModel) {
        throw new Error("model already exists");
      }
      this.monacoModel = this.monacoInstance.editor.createModel(
        this.getValue(),
        this.language,
        this.uri
      );
      this.monacoModelListener = this.onDidChangeContent(() => {
        if (!this.monacoModel || this.monacoModel.isDisposed()) {
          throw new Error("monaco model already disposed (change content)");
        }
        const value = this.getValue();
        if (this.monacoModel.getValue() !== value) {
          this.monacoModel.setValue(value);
        }
      });
    }
    return this.monacoModel;
  }

  private disposeMonacoModel() {
    if (this.monacoModelReferences > 0) {
      throw new Error("disposing TypeCellCodeModel, but still has references");
    }

    if (
      !this.monacoModel ||
      this.monacoModel.isDisposed() ||
      !this.monacoModelListener
    ) {
      console.warn("monaco already already disposed");
      // throw new Error("monaco already already disposed");
      return;
    }
    this.monacoModel.dispose();
    this.monacoModelListener.dispose();
  }

  public releaseMonacoModel() {
    this.monacoModelReferences--;
    if (this.monacoModelReferences < 0) {
      throw new Error("monaco model released too often");
    }
    if (this.monacoModelReferences === 0) {
      // We keep the monacomodel in cache. We keep a lazy reference to the Monaco Model, because
      // maybe someone else is quickly editing the underlying document,
      // which we then need to recompile and need a new Monaco model for
      console.log(
        "releaseMonacoModel no more references, but we're not disposing yet"
      );
    }
  }

  public dispose() {
    this._onWillDispose.fire();
    this.disposeMonacoModel();
    super.dispose();
  }
}

class ModelCollection extends lifecycle.ReferenceCollection<TypeCellCodeModel> {
  protected createReferencedObject(
    key: string,
    ...args: any[]
  ): TypeCellCodeModel {
    return new TypeCellCodeModel(key, args[0], args[1], args[2]);
  }

  protected destroyReferencedObject(
    key: string,
    object: TypeCellCodeModel
  ): void {
    object.dispose();
  }
}

const modelStore = new ModelCollection();

export function getTypeCellCodeModel(
  cell: NotebookCellModel,
  monacoInstance: typeof monaco
) {
  return modelStore.acquire(
    cell.path,
    cell.language,
    cell.code,
    monacoInstance
  );
}
