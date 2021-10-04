import { CompiledCodeModel } from "../../../../models/CompiledCodeModel";
import { event, lifecycle } from "vscode-lib";

type ModelProvider = {
  onDidCreateCompiledModel: event.Event<CompiledCodeModel>;
  compiledModels: CompiledCodeModel[];
};

export type MessageBridge = {
  updateModels: (
    bridgeId: string,
    models: {
      modelId: string;
      model: {
        value: string;
      };
    }[]
  ) => Promise<void>;
  updateModel: (
    bridgeId: string,
    modelId: string,
    model: {
      value: string;
    }
  ) => Promise<void>;
  deleteModel: (bridgeId: string, modelId: string) => Promise<void>;
};

export class ModelForwarder extends lifecycle.Disposable {
  private disposed = false;
  constructor(
    private readonly bridgeId: string,
    private readonly modelProvider: ModelProvider,
    private readonly messageBridge: MessageBridge
  ) {
    super();

    this._register(
      modelProvider.onDidCreateCompiledModel((m) => {
        this.registerModel(m);
      })
    );
  }

  public async initialize() {
    for (let model of this.modelProvider.compiledModels) {
      await this.registerModel(model, false);
    }
    // send in bulk
    await this.messageBridge.updateModels(
      this.bridgeId,
      this.modelProvider.compiledModels.map((m) => ({
        modelId: m.path,
        model: { value: m.getValue() },
      }))
    );
  }

  private async registerModel(model: CompiledCodeModel, sendToBridge = true) {
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
        });
      })
    );

    if (sendToBridge) {
      await this.messageBridge.updateModel(this.bridgeId, model.path, {
        value: model.getValue(),
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
