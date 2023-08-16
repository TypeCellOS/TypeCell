import {
  BasicCodeModel,
  IframeBridgeMethods,
  ModelProvider,
} from "@typecell-org/shared";
import { lifecycle } from "vscode-lib";

export type MessageBridge = Pick<
  IframeBridgeMethods,
  "updateModels" | "updateModel" | "deleteModel"
>;

/**
 * The ModelForwarder bridges a ModelProvider and the MessageBridge.
 *
 * It:
 * - listens to changes in the ModelProvider...
 * - ...and forwards these changes over the MessageBridge
 */
export class ModelForwarder extends lifecycle.Disposable {
  private disposed = false;
  constructor(
    private readonly bridgeId: string,
    private readonly modelProvider: ModelProvider,
    private readonly messageBridge: MessageBridge
  ) {
    super();

    this._register(
      modelProvider.onDidCreateModel((m) => {
        this.registerModel(m);
      })
    );
  }

  public async initialize() {
    for (const model of this.modelProvider.models) {
      await this.registerModel(model, false);
    }
    // send in bulk
    await this.messageBridge.updateModels(
      this.bridgeId,
      this.modelProvider.models.map((m) => ({
        modelId: m.path,
        model: { value: m.getValue(), language: m.language },
      }))
    );
  }

  private async registerModel(model: BasicCodeModel, sendToBridge = true) {
    if (this.disposed) {
      throw new Error("registering model on disposed engine");
    }

    this._register(
      model.onWillDispose(() => {
        this.messageBridge.deleteModel(this.bridgeId, model.path);
      })
    );

    this._register(
      model.onDidChangeContent(() => {
        this.messageBridge.updateModel(this.bridgeId, model.path, {
          value: model.getValue(),
          language: model.language,
        });
      })
    );

    if (sendToBridge) {
      await this.messageBridge.updateModel(this.bridgeId, model.path, {
        value: model.getValue(),
        language: model.language,
      });
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
