import React from "react";
import { DocumentResource } from "../../../../../store/DocumentResource";
import LocalExecutionHost from "../../../../../runtime/executor/executionHosts/local/LocalExecutionHost";
import SourceModelCompiler from "../../../../../runtime/compiler/SourceModelCompiler";

export const EngineContext = React.createContext({
  executionHost: undefined as undefined | LocalExecutionHost,
  compiler: undefined as undefined | SourceModelCompiler,
  document: undefined as undefined | DocumentResource,
});
