import { autorun, untracked } from "mobx";
import * as monaco from "monaco-editor";
import * as Y from "yjs";
import { compile } from "../compilers/MonacoCompiler";
import { NotebookCellModel } from "../documentRenderers/notebook/NotebookCellModel";
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

  constructor(
    public readonly path: string,
    public readonly language: string,
    private readonly codeText: Y.Text
  ) {
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
  public readonly onDidChangeContent: Event<void> =
    this._onDidChangeContent.event;

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

  public async getCompiledJavascriptCode() {
    if (this.language === "typescript") {
      const js = await compile(this);
      return js;
    } else if (this.language === "markdown") {
      // TODO: this is a hacky way to quickly support markdown. We compile markdown to JS so it can pass through the regular "evaluator".
      // We should refactor to support different languages, probably by creating different CellEvaluators per language
      return `define(["require", "exports", "markdown-it"], function (require, exports, markdown_it_1) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const md = markdown_it_1.default({
            html: true,
            linkify: true,
            typographer: true,
        });
        const render = md.render(${JSON.stringify(this.getValue())});
        const el = document.createElement("div");
        el.className = "markdown-body";
        el.innerHTML = render;
        exports.default = el;
        ;
    });`;
    }
    throw new Error("unsupported language");
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
    return new TypeCellCodeModel(key, args[0], args[1]);
  }

  protected destroyReferencedObject(
    key: string,
    object: TypeCellCodeModel
  ): void {
    object.dispose();
  }
}

const modelStore = new ModelCollection();

export function getTypeCellCodeModel(cell: NotebookCellModel) {
  return modelStore.acquire(cell.path, cell.language, cell.code);
}
