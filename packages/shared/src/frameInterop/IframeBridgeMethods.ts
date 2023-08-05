/**
 * The methods the iframe exposes that are callable by the host (from SandboxedExecutionHost)
 */
export type IframeBridgeMethods = {
  /**
   * Functions to update javascript code models
   */
  updateModels: (
    bridgeId: string,
    models: { modelId: string; model: { value: string; language: string } }[]
  ) => Promise<void>;
  updateModel: (
    bridgeId: string,
    modelId: string,
    model: { value: string; language: string }
  ) => Promise<void>;
  deleteModel: (bridgeId: string, modelId: string) => Promise<void>;

  /**
   * A helper method to determine whether the connection to the iframe is alive
   */
  ping: () => Promise<"pong">;
};
