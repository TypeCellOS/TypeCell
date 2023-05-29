import { createContext } from "react";
import SourceModelCompiler from "../../../runtime/compiler/SourceModelCompiler";
import { ExecutionHost } from "../../../runtime/executor/executionHosts/ExecutionHost";
import { DocumentResource } from "../../../store/DocumentResource";

export const RichTextContext = createContext<{
  executionHost: ExecutionHost;
  compiler: SourceModelCompiler;
  document: DocumentResource;
}>({
  executionHost: undefined as any,
  compiler: undefined as any,
  document: undefined as any,
});
