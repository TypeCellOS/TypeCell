import { lifecycle, event } from "vscode-lib";
import { CompiledCodeModel } from "../../../../../models/CompiledCodeModel";

export class ModelReceiver extends lifecycle.Disposable {
  private registeredModels = new Map<string, CompiledCodeModel>();
  private disposed = false;

  private readonly _onDidCreateCompiledModel: event.Emitter<CompiledCodeModel> =
    this._register(new event.Emitter<CompiledCodeModel>());

  public readonly onDidCreateCompiledModel: event.Event<CompiledCodeModel> =
    this._onDidCreateCompiledModel.event;

  public get compiledModels() {
    return Array.from(this.registeredModels.values());
  }

  public deleteModel(modelId: string) {
    console.log("deleteModel", modelId);
    let model = this.registeredModels.get(modelId);
    if (model) {
      this.registeredModels.delete(modelId);
      model.dispose();
    }
  }

  public updateModel(modelId: string, model: { value: string }) {
    console.log("updateModel", modelId);
    let existingModel = this.registeredModels.get(modelId);
    if (!existingModel) {
      existingModel = new CompiledCodeModel(modelId, model.value);
      this.registeredModels.set(modelId, existingModel);

      this._onDidCreateCompiledModel.fire(existingModel);
    } else {
      existingModel.setValue(model.value);
    }
  }

  public dispose() {
    if (this.disposed) {
      throw new Error("ModelForwarder already disposed");
    }
    this.disposed = true;
    super.dispose();
  }
}
