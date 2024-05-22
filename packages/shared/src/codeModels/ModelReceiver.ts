import { event, lifecycle, uri } from "vscode-lib";
import { BasicCodeModel } from "./BasicCodeModel.js";
import { ModelProvider } from "./ModelProvider.js";

/**
 * The modelReceiver:
 * - tracks models ("code models" are objects containing compiled typescript or compiled javascript code)
 *    received over the bridge from the Host
 * - Can be used to pass in to Engine, which (re)evaluates the code
 */
export class ModelReceiver
  extends lifecycle.Disposable
  implements ModelProvider
{
  private registeredModels = new Map<string, BasicCodeModel>();
  private disposed = false;

  private readonly _onDidCreateModel: event.Emitter<BasicCodeModel> =
    this._register(new event.Emitter<BasicCodeModel>());

  public readonly onDidCreateModel: event.Event<BasicCodeModel> =
    this._onDidCreateModel.event;

  public get models() {
    return Array.from(this.registeredModels.values());
  }

  public deleteModel(modelId: string) {
    console.log("deleteModel", modelId);
    const model = this.registeredModels.get(modelId);
    if (model) {
      this.registeredModels.delete(modelId);
      model.dispose();
    }
  }

  public updateModel(
    modelId: string,
    model: { value: string; language: string },
  ) {
    console.log("updateModel", modelId);
    let existingModel = this.registeredModels.get(modelId);
    if (!existingModel) {
      const modelUri = uri.URI.parse(modelId);

      existingModel = new BasicCodeModel(
        modelUri.toString(),
        model.value,
        model.language,
      );
      this.registeredModels.set(modelId, existingModel);

      this._onDidCreateModel.fire(existingModel);
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
