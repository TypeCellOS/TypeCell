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
  registerTypeCellModuleCompiler: (moduleName: string) => Promise<string>;
  unregisterTypeCellModuleCompiler: (moduleName: string) => Promise<void>;

  /**
   * Function for y-penpal
   */
  processYjsMessage: (message: Uint8Array) => Promise<void>;
};
