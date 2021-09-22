import { Engine } from "@typecell-org/engine";
import { observable, runInAction } from "mobx";
import { AsyncMethodReturns, Connection, connectToParent } from "penpal";
import { lifecycle } from "vscode-lib";
import { CompiledCodeModel } from "../../../../../models/CompiledCodeModel";
import { getTypeCellResolver } from "../../../resolver/resolver";
import { ModelOutput } from "../../ModelOutput";
import type SandboxedExecutionHost from "../SandboxedExecutionHost";
import { ModelReceiver } from "./ModelReceiver";

let ENGINE_ID = 0;

export class FrameConnection extends lifecycle.Disposable {
  private readonly connection: Connection<SandboxedExecutionHost["methods"]>;
  private connectionMethods:
    | AsyncMethodReturns<SandboxedExecutionHost["methods"]>
    | undefined;

  private readonly engine: Engine<CompiledCodeModel>;

  public readonly id = ENGINE_ID++;

  // TODO: maybe observable map is not necessary / we can easily remove mobx dependency here
  public readonly outputs = observable.map<string, ModelOutput>(undefined, {
    deep: false,
  });

  public readonly modelPositions =
    observable.map<
      string,
      {
        x: number;
        y: number;
      }
    >();

  private readonly modelReceivers = new Map<string, ModelReceiver>();

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
          modelOutput = this._register(new ModelOutput("", model));
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
    updateModel: async (
      bridgeId: string,
      modelId: string,
      model: { value: string }
    ) => {
      const modelReceiver = this.modelReceivers.get(bridgeId);
      if (modelReceiver) {
        if (bridgeId === "main" && !this.modelPositions.has(modelId)) {
          this.modelPositions.set(
            modelId,
            observable({
              x: 0,
              y: 0,
            })
          );
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
  };
  async initialize() {
    console.log("initialize FrameConnection");
    this.connectionMethods = await this.connection.promise;
  }
}
