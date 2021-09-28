import { lifecycle, event } from "vscode-lib";
import { CompiledCodeModel } from "../../../../models/CompiledCodeModel";

export type TypeCellCompiledCodeProvider = lifecycle.IDisposable & {
  onDidCreateCompiledModel: event.Event<CompiledCodeModel>;
  compiledModels: CompiledCodeModel[];
};
