import { VisualizersByPath } from "../../../../extensions/visualizer/VisualizerExtension";

/**
 * The methods the iframe exposes that are callable by the host (from SandboxedExecutionHost)
 */
export type IframeBridgeMethods = {
  /**
   * Functions to update javascript code models
   */
  updateModels: (
    bridgeId: string,
    models: { modelId: string; model: { value: string } }[]
  ) => Promise<void>;
  updateModel: (
    bridgeId: string,
    modelId: string,
    model: { value: string }
  ) => Promise<void>;
  deleteModel: (bridgeId: string, modelId: string) => Promise<void>;

  /**
   * The position where the output of a certain cell should be rendered has changed
   */
  updatePositions: (
    id: string,
    incomingPositions: { x: number; y: number }
  ) => Promise<void>;

  /**
   * A helper method to determine whether the connection to the iframe is alive
   */
  ping: () => Promise<"pong">;

  // used for type visualizers (experimental)
  updateVisualizers: (e: VisualizersByPath) => Promise<void>;
};
