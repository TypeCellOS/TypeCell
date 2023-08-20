import type * as monaco from "monaco-editor";
import { event, lifecycle } from "vscode-lib";

import { BasicCodeModel, CodeModel, ModelProvider } from "@typecell-org/shared";

import { getMonacoModel } from "../../models/MonacoModelManager";
import { compile } from "./compilers/MonacoCompiler";

export default class SourceModelCompiler
  extends lifecycle.Disposable
  implements ModelProvider
{
  public disposed = false;

  private async compile(model: monaco.editor.ITextModel) {
    if (model.getLanguageId() === "typescript") {
      const js = await compile(model, this.monacoInstance);
      return js;
    } else if (model.getLanguageId() === "markdown") {
      // TODO: this is a hacky way to quickly support markdown. We compile markdown to JS so it can pass through the regular "evaluator".
      // We should refactor to support different languages, probably by creating different CellEvaluators per language
      return `define(["require", "exports", "markdown-it"], function (require, exports, markdown_it_1) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          const md = markdown_it_1({
              html: true,
              linkify: true,
              typographer: true,
          });

          const render = md.render(${JSON.stringify(model.getValue())});
          const el = document.createElement("div");
          el.className = "markdown-body";
          el.innerHTML = render;
          exports.default = el;
          ;
      });`;
    } else if (model.getLanguageId() === "css") {
      // TODO: same as above comment for markdown
      return `define(["require", "exports"], function (require, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          const style = document.createElement("style");
          style.setAttribute("type", "text/css");
          style.appendChild(document.createTextNode(${JSON.stringify(
            model.getValue()
          )}));
          exports.default = style;
          ;
      });`;
    }
    throw new Error("unsupported language");
  }

  public readonly registeredModels = new Map<
    string,
    {
      sourceModel: CodeModel;
      monacoModel: { object: monaco.editor.ITextModel; dispose: () => void };
      compiledModel: BasicCodeModel;
    }
  >();

  private readonly _onDidCreateModel: event.Emitter<BasicCodeModel> =
    this._register(new event.Emitter<BasicCodeModel>());

  public readonly onDidCreateModel: event.Event<BasicCodeModel> =
    this._onDidCreateModel.event;

  public get models() {
    return Array.from(this.registeredModels.values()).map(
      (el) => el.compiledModel
    );
  }

  /**
   * Register a model to the engine. After registering, the model will be observed for changes and automatically re-evaluated.
   *
   * When the model is disposed (model.dispose()), the model is automatically unregistered.
   * @param model model to register
   */
  public registerModel(sourceModel: CodeModel) {
    if (this.disposed) {
      throw new Error("registering model on disposed engine");
    }
    if (this.registeredModels.has(sourceModel.path)) {
      console.warn("model already registered"); // TODO: shouldn't happen
      return;
    }
    // TODO: perhaps not register empty compiled model?
    const compiledModel = new BasicCodeModel(
      sourceModel.path,
      "",
      "javascript"
    );

    const monacoModel = getMonacoModel(
      sourceModel.getValue(),
      sourceModel.language,
      sourceModel.uri,
      this.monacoInstance
    );

    this.registeredModels.set(sourceModel.path, {
      sourceModel,
      monacoModel,
      compiledModel,
    });
    const compile = async () => {
      try {
        const compiled = await this.compile(monacoModel.object);
        compiledModel.setValue(compiled);
      } catch (e) {
        console.error("compile error", e);
        throw e;
      }
    };
    let prevValue: string | undefined = sourceModel.getValue();
    let prevLanguage: string | undefined = sourceModel.language;

    this._register(
      sourceModel.onDidChangeContent((_event) => {
        // make sure there were actual changes from the previous value
        const newValue = sourceModel.getValue();
        const newLanguage = sourceModel.language;
        if (newValue === prevValue && newLanguage === prevLanguage) {
          console.warn("same value");
          return;
        }
        if (monacoModel.object.getValue() !== newValue) {
          // make sure models are in sync. If sourceModel is actualy a MonacoCodeModel, this will already be the case
          monacoModel.object.setValue(newValue);
        }

        prevValue = newValue;
        prevLanguage = newLanguage;
        compile();
      })
    );

    // evaluate initial
    compile(); // TODO: await?

    this._register(
      sourceModel.onWillDispose(() => {
        const models = this.registeredModels.get(sourceModel.path);
        if (!models) {
          throw new Error("unexpected: model not found");
        }
        this.registeredModels.delete(sourceModel.path);
        models.compiledModel.dispose();
        models.monacoModel.dispose();
      })
    );
    this._onDidCreateModel.fire(compiledModel);
  }

  constructor(
    // private readonly documentId: string,
    private readonly monacoInstance: typeof monaco
  ) {
    super();
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("CompileEngine already disposed");
    }

    this.registeredModels.forEach((el) => {
      el.compiledModel.dispose();
      el.monacoModel.dispose();
    });

    this.disposed = true;
    super.dispose();
  }
}
