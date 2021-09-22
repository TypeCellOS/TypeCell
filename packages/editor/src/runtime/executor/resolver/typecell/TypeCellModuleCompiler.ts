import { parseIdentifier } from "../../../../identifiers";
import { DocConnection } from "../../../../store/DocConnection";
import type * as monaco from "monaco-editor";
import SourceModelCompiler from "../../../compiler/SourceModelCompiler";
import { autorun, untracked } from "mobx";
import { getTypeCellCodeModel } from "../../../../models/TypeCellCodeModel";
import { lifecycle } from "vscode-lib";

export class TypeCellModuleCompiler extends SourceModelCompiler {
  private readonly connection: DocConnection;
  private releasePreviousModels: (() => void) | undefined;
  // public readonly compiler: SourceModelCompiler;

  constructor(
    private readonly moduleName: string,
    monacoInstance: typeof monaco
  ) {
    super(monacoInstance);
    if (!moduleName.startsWith("!@")) {
      throw new Error("invalid module name");
    }

    const identifier = parseIdentifier(moduleName.substr(1));

    this.connection = DocConnection.load(identifier);

    // this.compiler = new SourceModelCompiler(monacoInstance);

    // TODO: refactor, and releaseModel()
    const disposeAutorun = autorun(() => {
      const cells = this.connection.tryDoc?.doc.cells;
      if (!cells) {
        return;
      }
      untracked(() => {
        // untracked, because getModel accesses observable data in the cell (code.tostring)
        this.releasePreviousModels?.();
        const models = cells.map((c) =>
          getTypeCellCodeModel(c, monacoInstance)
        );
        models.forEach((m) => {
          // if (needsTypesInMonaco) {
          m.object.acquireMonacoModel();
          // }
          this.registerModel(m.object);
        });
        this.releasePreviousModels = () => {
          models.forEach((m) => {
            // if (needsTypesInMonaco) {
            m.object.releaseMonacoModel();
            // }
            m.dispose();
          });
        };
      });
    });

    this._register({
      dispose: disposeAutorun,
    });
  }

  public dispose() {
    super.dispose();

    this.connection.dispose();
    this.releasePreviousModels?.();
  }
}
