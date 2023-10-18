import { createContext } from "react";
import { EditorStore } from "./EditorStore";
import SourceModelCompiler from "./runtime/compiler/SourceModelCompiler";
import { ExecutionHost } from "./runtime/executor/executionHosts/ExecutionHost";

export const RichTextContext = createContext<{
  editorStore: EditorStore;
  executionHost: ExecutionHost;
  compiler: SourceModelCompiler;
  documentId: string;
}>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorStore: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executionHost: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compiler: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentId: undefined as any,
});
