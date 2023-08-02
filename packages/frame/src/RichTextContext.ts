import { createContext } from "react";
import SourceModelCompiler from "./runtime/compiler/SourceModelCompiler";
import { ExecutionHost } from "./runtime/executor/executionHosts/ExecutionHost";

export const RichTextContext = createContext<{
  executionHost: ExecutionHost;
  compiler: SourceModelCompiler;
  documentId: string;
}>({
  executionHost: undefined as any,
  compiler: undefined as any,
  documentId: undefined as any,
});
