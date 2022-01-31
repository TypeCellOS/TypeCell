import { LocalModuleResolver } from "@typecell-org/engine";
import * as markdownit from "markdown-it";
import * as react from "react";
import * as reactdnd from "react-dnd";
import * as reactdom from "react-dom";
import * as jsxruntime from "react/jsx-runtime";

const sz = require("frontend-collective-react-dnd-scrollzone");

async function resolveNestedModule(id: string, mode?: string) {
  if (id === "markdown-it") {
    return markdownit;
  }

  if (id === "react" && (!mode || mode === "imports/optimized/react.js")) {
    return react;
  }

  if (id === "react" && mode === "imports/unoptimized/jsx-runtime.js") {
    return jsxruntime;
  }

  if (id === "react-dom") {
    return reactdom;
  }

  if (id === "frontend-collective-react-dnd-scrollzone") {
    return sz;
  }

  if (id === "react-dnd") {
    return reactdnd;
  }

  // We might want to remove hardcoded dependency for deckgl... We can't do this for every library..

  if (id === "@deck.gl/react") {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return await import("@deck.gl/react");
  }

  if (id === "probe.gl") {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return await import("probe.gl");
  }

  if (id === "@loaders.gl/core") {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return await import("probe.gl");
  }

  if (id === "@deck.gl/aggregation-layers") {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return await import("@deck.gl/aggregation-layers");
  }

  if (id === "@loaders.gl/images") {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return await import("@loaders.gl/images");
  }

  return undefined;
}

export const LocalResolver = new LocalModuleResolver(resolveNestedModule);
