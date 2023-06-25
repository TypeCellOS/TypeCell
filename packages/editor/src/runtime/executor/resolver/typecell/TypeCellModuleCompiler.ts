import { autorun, untracked } from "mobx";
import type * as monaco from "monaco-editor";
import { parseIdentifier } from "../../../../identifiers";
import { getTypeCellCodeModel } from "../../../../models/YTextTypeCellCodeModel";
import { DocConnection } from "../../../../store/DocConnection";
import { SessionStore } from "../../../../store/local/SessionStore";
import SourceModelCompiler from "../../../compiler/SourceModelCompiler";

export class TypeCellModuleCompiler extends SourceModelCompiler {
  private readonly connection: DocConnection;
  private releasePreviousModels: (() => void) | undefined;

  constructor(
    private readonly moduleName: string,
    monacoInstance: typeof monaco,
    sessionStore: SessionStore
  ) {
    super(monacoInstance);
    if (!moduleName.startsWith("!@")) {
      throw new Error("invalid module name");
    }

    // TODO
    const identifier = parseIdentifier(moduleName.substring(1));

    this.connection = DocConnection.load(identifier, sessionStore);

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
          m.object.acquireMonacoModel();
          this.registerModel(m.object);
        });
        this.releasePreviousModels = () => {
          models.forEach((m) => {
            m.object.releaseMonacoModel();
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
