import { Engine } from "@typecell-org/engine";
import { observable, runInAction } from "mobx";
import { AsyncMethodReturns, Connection, connectToParent } from "penpal";
import { lifecycle } from "vscode-lib";
import { CompiledCodeModel } from "../../../../../models/CompiledCodeModel";
import { getTypeCellResolver } from "../../../resolver/resolver";
import { ModelOutput } from "../../../components/ModelOutput";
import type SandboxedExecutionHost from "../SandboxedExecutionHost";
import { ModelReceiver } from "./ModelReceiver";
import type { VisualizersByPath } from "../../../../extensions/visualizer/VisualizerExtension";

let ENGINE_ID = 0;

export class FrameConnection extends lifecycle.Disposable {
  private readonly connection: Connection<SandboxedExecutionHost["methods"]>;
  private connectionMethods:
    | AsyncMethodReturns<SandboxedExecutionHost["methods"]>
    | undefined;

  private readonly engine: Engine<CompiledCodeModel>;
  private readonly modelReceivers = new Map<string, ModelReceiver>();

  public readonly id = ENGINE_ID++;

  public readonly outputs = observable.map<string, ModelOutput>(undefined, {
    deep: false,
  });

  public readonly modelPositions = observable.map<
    string,
    {
      x: number;
      y: number;
    }
  >();

  constructor() {
    super();
    this.engine = new Engine<CompiledCodeModel>(
      getTypeCellResolver("TODO", "FC-" + this.id, (moduleName) => {
        const modelReceiver = new ModelReceiver();
        // TODO: what if we have multiple usage of the same module?
        this.modelReceivers.set("modules/" + moduleName, modelReceiver);
        this.connectionMethods!.registerTypeCellModuleCompiler(moduleName);
        return {
          get compiledModels() {
            return modelReceiver.compiledModels;
          },
          dispose: () => {
            modelReceiver.dispose();
            this.connectionMethods!.unregisterTypeCellModuleCompiler(
              moduleName
            );
          },
          onDidCreateCompiledModel:
            modelReceiver.onDidCreateCompiledModel.bind(modelReceiver),
        };
      })
    );
    const mainModelReceiver = this._register(new ModelReceiver());
    this.modelReceivers.set("main", mainModelReceiver);
    this.engine.registerModelProvider(mainModelReceiver);

    this._register(
      this.engine.onOutput(({ model, output }) => {
        let modelOutput = this.outputs.get(model.path);
        if (!modelOutput) {
          modelOutput = this._register(
            new ModelOutput(this.engine.observableContext.context)
          );
          this.outputs.set(model.path, modelOutput);
        }
        modelOutput.updateValue(output);
      })
    );

    this.connection = connectToParent({
      // Methods child is exposing to parent
      methods: this.methods,
    });
    this.initialize().then(
      () => {
        console.log("FrameConnection connection established");
      },
      (e) => {
        console.error("FrameConnection connection failed", e);
      }
    );
  }

  public setDimensions(
    path: string,
    dimensions: { width: number; height: number }
  ) {
    this.connectionMethods!.setDimensions(path, dimensions);
  }

  public mouseLeave(path: string) {
    console.log("mouseLeave");
    this.connectionMethods!.mouseLeave(path);
  }

  private methods = {
    updateModels: async (
      bridgeId: string,
      models: { modelId: string; model: { value: string } }[]
    ) => {
      for (let model of models) {
        await this.methods.updateModel(bridgeId, model.modelId, model.model);
      }
    },
    updateModel: async (
      bridgeId: string,
      modelId: string,
      model: { value: string }
    ) => {
      console.log("register model", modelId);
      const modelReceiver = this.modelReceivers.get(bridgeId);
      if (modelReceiver) {
        if (bridgeId === "main" && !this.modelPositions.has(modelId)) {
          runInAction(() => {
            this.modelPositions.set(
              modelId,
              observable({
                x: 0,
                y: 0,
              })
            );
          });
        }
        modelReceiver.updateModel(modelId, model);
      } else {
        throw new Error("unknown bridgeId");
      }
    },

    deleteModel: async (bridgeId: string, modelId: string) => {
      const modelReceiver = this.modelReceivers.get(bridgeId);
      if (modelReceiver) {
        if (bridgeId === "main") {
          this.modelPositions.delete(modelId);
        }
        modelReceiver.deleteModel(modelId);
      } else {
        throw new Error("unknown bridgeId");
      }
    },

    updatePositions: async (
      id: string,
      incomingPositions: { x: number; y: number }
    ) => {
      console.log("updatePositions", id, incomingPositions);
      let positions = this.modelPositions.get(id);

      runInAction(() => {
        if (!positions) {
          throw new Error("update positions for unknown model");
        }
        positions.x = incomingPositions.x;
        positions.y = incomingPositions.y;
      });
    },
    ping: () => {
      console.log("ping received, sending pong");
      return "pong";
    },
    updateVisualizers: (e: VisualizersByPath) => {
      for (let [path, visualizers] of Object.entries(e)) {
        this.outputs.get(path)!.updateVisualizers(visualizers);
      }
    },
  };
  async initialize() {
    console.log("initialize FrameConnection");
    this.connectionMethods = await this.connection.promise;
  }
}
