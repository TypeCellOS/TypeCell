import type * as monaco from "monaco-editor";
import React from "react";

export const MonacoContext = React.createContext({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monaco: undefined as any as typeof monaco,
});
