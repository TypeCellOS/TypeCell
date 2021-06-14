import React from "react";
import { DocumentResource } from "../../../../store/DocumentResource";
import EngineWithOutput from "../../../../typecellEngine/EngineWithOutput";

export const EngineContext = React.createContext({
  engine: undefined as undefined | EngineWithOutput,
  document: undefined as undefined | DocumentResource,
});
