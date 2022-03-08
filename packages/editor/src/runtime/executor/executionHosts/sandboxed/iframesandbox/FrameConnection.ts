import { Engine } from "@typecell-org/engine";
import { observable, runInAction } from "mobx";
import { AsyncMethodReturns, Connection, connectToParent } from "penpal";
import { lifecycle } from "vscode-lib";
import { CompiledCodeModel } from "../../../../../models/CompiledCodeModel";
import { getTypeCellResolver } from "../../../resolver/resolver";
import { ModelOutput } from "../../../components/ModelOutput";
import { ModelReceiver } from "./ModelReceiver";
import type { VisualizersByPath } from "../../../../extensions/visualizer/VisualizerExtension";
import { IframeBridgeMethods } from "./IframeBridgeMethods";
import { HostBridgeMethods } from "../HostBridgeMethods";

let ENGINE_ID = 0;

/**
 * FrameConnection contains the main logic for communicating with the Host and
 * evaluating compiled code from the host.
 */
export class FrameConnection extends lifecycle.Disposable {
  public readonly id = ENGINE_ID++;

  /**
   * Map of <cellPath, ModelOutput> that keeps track of the variables exported by every cell
   */
  public readonly outputs = observable.map<string, ModelOutput>(undefined, {
    deep: false,
  });

  /**
   * Map of <cellPath, { x, y }> that keeps track of the positions of every cell.
   * These positions are passed in from the host
   */
  public readonly modelPositions = observable.map<
    string,
    {
      x: number;
      y: number;
    }
  >();

  /**
   * Penpal postmessage connection to the host
   */
  private readonly connection: Connection<HostBridgeMethods>;

  /**
   * Penpal postmessage connection methods exposed by the host
   */
  private connectionMethods: AsyncMethodReturns<HostBridgeMethods> | undefined;

  /**
   * The Reactive engine (packages/engine) that evaluates and re-evaluates javascript code
   */
  private readonly engine: Engine<CompiledCodeModel>;

  /**
   * A map of modelReceivers that receive code models (javascript source code).
   * - the ModelReceiver with key "main" is used for the cells of the main notebook
   * - Other modelReceivers are added to this map for TypeCell imports
   */
  private readonly modelReceivers = new Map<string, ModelReceiver>();

  constructor() {
    super();
    this.engine = new Engine<CompiledCodeModel>(this.getModuleResolver());

    // mainModelReceiver receives compiled code from the Host via the Bridge
    // it then passes compiled code to the reactive Engine which is responsible for
    // evaluating (and automatically reevaluating the compiled javascript)
    //
    // SandboxedExecutionHost: compiles code cells
    // --> passes compiled code over the bridge to mainModelReceiver
    // --> mainModelReceiver passes the compiled code to the Engine

    // instantiate mainModelReceiver
    const mainModelReceiver = this._register(new ModelReceiver());
    this.modelReceivers.set("main", mainModelReceiver);

    // pass the code to the engine by acting as a ModelProvider
    this.engine.registerModelProvider(mainModelReceiver);

    // Listen to outputs of evaluated cells
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

  /**
   * We call this when the dimensions of a cell output has changed,
   * so we can forward this data to the host
   */
  public setDimensions(
    path: string,
    dimensions: { width: number; height: number }
  ) {
    this.connectionMethods!.setDimensions(path, dimensions);
  }

  /**
   * We call this when the user's mouse leaves a Cell Output,
   * and forward this event to the host (so it can take back control of mouse events)
   */
  public mouseLeave() {
    this.connectionMethods!.mouseLeave();
  }

  /**
   * getModuleResolver() returns a module resolver that can resolve imports required
   * by the evaluated javascript code
   */
  private getModuleResolver() {
    return getTypeCellResolver(
      "mainNotebook",
      "frame-" + this.id,
      (moduleName) => {
        // How to resolve typecell modules (i.e.: `import * as nb from "!@user/notebook`")

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
      }
    );
  }

  /**
   * Methods exposed to the host
   */
  private methods: IframeBridgeMethods = {
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
    ping: async () => {
      console.log("ping received, sending pong");
      return "pong";
    },

    // For type visualizers (experimental)
    updateVisualizers: async (e: VisualizersByPath) => {
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
