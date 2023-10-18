import { ReactiveEngine } from "@typecell-org/engine";
import { BasicCodeModel } from "@typecell-org/shared";
import React from "react";
import { lifecycle } from "vscode-lib";
import { ModelOutput } from "../components/ModelOutput";

/**
 * The ExecutionHost is responsible for rendering the output of a notebook/code cell.
 * The abstraction is introduced to support the Iframe Sandbox
 *
 * There are two types of ExecutionHosts:
 * - Local
 * - Sandboxed
 *
 * The LocalExecutionHost just renders output in the same document as the container, and can be used for testing
 * The SandboxExecutionHost renders an iframe and evaluates end-user code in there, to isolate the code execution in a different domain.
 *
 * ExecutionHosts are called from NotebookRenderer (which renders the monaco editors for cells)
 */
export type ExecutionHost = lifecycle.IDisposable & {
  /**
   * Render the container of the execution host:
   * - the LocalExecutionHost doesn't use this
   * - the Sandbox uses this to render the <iframe>
   */
  renderContainer(): React.ReactElement;

  /**
   * Render the cell output:
   * - the LocalExecutionHost renders the Cell Output directly
   * - the Sandbox renders a "fake" div (OutputShadow) that has the same size as the actual output.
   *   The actual output is rendered in the <iframe> which is rendered in renderContainer()
   */
  renderOutput(
    modelPath: string,
    setHovering?: (hover: boolean) => void,
  ): React.ReactElement;

  readonly engine: ReactiveEngine<BasicCodeModel>;
  readonly outputs: Map<string, ModelOutput>; // TODO
};
