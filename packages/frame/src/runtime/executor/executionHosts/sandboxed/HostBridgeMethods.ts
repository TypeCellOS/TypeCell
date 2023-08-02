/**
 * The methods the host exposes that are callable by the iframe (from iframesandbox/FrameConnection)
 */
export type HostBridgeMethods = {
  /**
   * This is used to resolve imported TypeCell modules. When the Javascript evaluated in the import,
   * it can require another TypeCell notebook using `import * as nb from "!@username/notebook"`.
   *
   * The host then needs to fetch this module (!@username/notebook) from TypeCell, compile it, and
   * send the compiled javascript back to the iframe. It also keeps watching the TypeCell module for changes
   * and sends changes across the bridge.
   */
  registerTypeCellModuleCompiler: (moduleName: string) => Promise<void>;
  unregisterTypeCellModuleCompiler: (moduleName: string) => Promise<void>;

  /**
   * Call when the mouse exits the output of a cell
   */
  mouseLeave: () => Promise<void>;

  /**
   * Call when dimensenions of the output of cell `id` have changed.
   */
  setDimensions: (
    id: string,
    dimensions: { width: number; height: number }
  ) => Promise<void>;
};
