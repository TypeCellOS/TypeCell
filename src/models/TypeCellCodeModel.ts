import { autorun, untracked } from "mobx";
import * as monaco from "monaco-editor";
import * as Y from "yjs";
import { CodeModel } from "../engine/CodeModel";
import { Emitter, Event } from "../util/vscode-common/event";
import {
  Disposable,
  IDisposable,
  ReferenceCollection,
} from "../util/vscode-common/lifecycle";
import { CellModel } from "./CellModel";

/**
 * A CodeModel that bridges yjs and Monaco.
 * The model is added to the monaco runtime the first time acquireMonacoModel is called.
 * It's then kept in monaco until all references to TypeCellCodeModel are released.
 *
 * TypeCellCodeModel observes a Y.Text as source-of-truth
 */
export class TypeCellCodeModel extends Disposable implements CodeModel {
  private readonly uri: monaco.Uri;

  constructor(public readonly path: string, private readonly codeText: Y.Text) {
    super();
    const dispose = autorun(() => {
      this.codeText.toString(); // tracked by mobx
      this._onDidChangeContent.fire();
    });
    this._register({
      dispose,
    });
    this.uri = monaco.Uri.file(path);
  }

  public getValue() {
    return untracked(() => this.codeText.toString());
  }

  private readonly _onWillDispose: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onWillDispose: Event<void> = this._onWillDispose.event;

  private readonly _onDidChangeContent: Emitter<void> = this._register(
    new Emitter<void>()
  );
  public readonly onDidChangeContent: Event<void> = this._onDidChangeContent
    .event;

  private monacoModelListener: IDisposable | undefined;
  private monacoModelReferences = 0;
  private monacoModel: monaco.editor.ITextModel | undefined;

  public acquireMonacoModel() {
    this.monacoModelReferences++;
    if (!this.monacoModel) {
      this.monacoModel = monaco.editor.getModel(this.uri) || undefined;
      if (this.monacoModel) {
        throw new Error("model already exists");
      }
      this.monacoModel = monaco.editor.createModel(
        this.getValue(),
        "typescript",
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
      throw new Error("monaco already already disposed");
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

class ModelCollection extends ReferenceCollection<TypeCellCodeModel> {
  protected createReferencedObject(
    key: string,
    ...args: any[]
  ): TypeCellCodeModel {
    return new TypeCellCodeModel(key, args[0]);
  }

  protected destroyReferencedObject(
    key: string,
    object: TypeCellCodeModel
  ): void {
    object.dispose();
  }
}

const modelStore = new ModelCollection();

export function getTypeCellCodeModel(cell: CellModel) {
  return modelStore.acquire(cell.path, cell.code);
}
