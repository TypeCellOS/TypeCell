import { createContext } from "react";
import SourceModelCompiler from "./runtime/compiler/SourceModelCompiler";
import { ExecutionHost } from "./runtime/executor/executionHosts/ExecutionHost";

export const RichTextContext = createContext<{
  executionHost: ExecutionHost;
  compiler: SourceModelCompiler;
  documentId: string;
}>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executionHost: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compiler: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentId: undefined as any,
});
