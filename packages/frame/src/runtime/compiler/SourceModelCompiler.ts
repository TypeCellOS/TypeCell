import type * as monaco from "monaco-editor";
import { event, lifecycle } from "vscode-lib";

import { CodeModel } from "@typecell-org/engine";
import { ModelProvider } from "../../interop/ModelProvider";
import { BasicCodeModel } from "../../models/BasicCodeModel";
import { compile } from "./compilers/MonacoCompiler";

export default class SourceModelCompiler
  extends lifecycle.Disposable
  implements ModelProvider
{
  private disposed: boolean = false;

  private async compile(sourceModel: CodeModel) {
    if (sourceModel.language === "typescript") {
      const js = await compile(sourceModel, this.monacoInstance);
      return js;
    } else if (sourceModel.language === "markdown") {
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

          const render = md.render(${JSON.stringify(sourceModel.getValue())});
          const el = document.createElement("div");
          el.className = "markdown-body";
          el.innerHTML = render;
          exports.default = el;
          ;
      });`;
    } else if (sourceModel.language === "css") {
      // TODO: same as above comment for markdown
      return `define(["require", "exports"], function (require, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          const style = document.createElement("style");
          style.setAttribute("type", "text/css");
          style.appendChild(document.createTextNode(${JSON.stringify(
            sourceModel.getValue()
          )}));
          exports.default = style;
          ;
      });`;
    }
    throw new Error("unsupported language");
  }

  public readonly registeredModels = new Map<
    string,
    { sourceModel: CodeModel; compiledModel: BasicCodeModel }
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
    this.registeredModels.set(sourceModel.path, { sourceModel, compiledModel });
    const compile = async () => {
      try {
        const compiled = await this.compile(sourceModel);
        compiledModel.setValue(compiled);
      } catch (e) {
        console.error("compile error", e);
        throw e;
      }
    };
    let prevValue: string | undefined = sourceModel.getValue();

    this._register(
      sourceModel.onDidChangeContent((_event) => {
        if (sourceModel.getValue() !== prevValue) {
          // make sure there were actual changes from the previous value

          prevValue = sourceModel.getValue();
          compile();
        } else {
          console.warn("same value");
        }
      })
    );

    // evaluate initial
    compile(); // TODO: await?

    this._register(
      sourceModel.onWillDispose(() => {
        const compiledModel = this.registeredModels.get(
          sourceModel.path
        )?.compiledModel;
        if (!compiledModel) {
          throw new Error("unexpected: compiled model not found");
        }
        this.registeredModels.delete(sourceModel.path);
        compiledModel.dispose();
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
    this.disposed = true;
    super.dispose();
  }
}
