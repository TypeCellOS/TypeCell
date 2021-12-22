import React from "react";
import SourceModelCompiler from "../../../../../runtime/compiler/SourceModelCompiler";
import { ExecutionHost } from "../../../../../runtime/executor/executionHosts/ExecutionHost";
import { DocumentResource } from "../../../../../store/DocumentResource";

export const EngineContext = React.createContext({
  executionHost: undefined as undefined | ExecutionHost,
  compiler: undefined as undefined | SourceModelCompiler,
  document: undefined as undefined | DocumentResource,
});
