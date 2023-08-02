import React from "react";
import type * as monaco from "monaco-editor";

export const MonacoContext = React.createContext({
  monaco: undefined as any as typeof monaco,
});
