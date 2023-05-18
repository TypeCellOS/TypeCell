import { createContext } from "react";
import { Identifier } from "../../identifiers/Identifier";

export const RouteContext = createContext<{
  identifiers: Identifier[];
}>({ identifiers: [] });
