import { LocalModuleResolver } from "@typecell-org/engine";
import markdownit from "markdown-it";
import * as react from "react";
import * as reactdom from "react-dom";
import * as jsxruntime from "react/jsx-runtime";

/**
 * Some 3rd party libraries are shipped with TypeCell,
 * the LocalResolver resolves modules to these, so we don't need to load
 * them from a third party CDN
 */
async function resolveNestedModule(id: string, mode?: string) {
  if (id === "markdown-it") {
    // This is used by markdown cells
    return markdownit;
  }

  // Any import if React and related libraries, we want to resolve to the
  // local imported React. Otherwise we get multiple instances of React, which breaks things
  // (plus, it's inefficient to load the library from a CDN)
  if (
    id === "react" &&
    (!mode ||
      mode === "imports/optimized/react.js" ||
      mode === "es2021/react.js")
  ) {
    return react;
  }

  if (id === "react" && mode === "imports/unoptimized/jsx-runtime.js") {
    return jsxruntime;
  }

  if (id === "react-dom") {
    return reactdom;
  }

  // was used for some experiments, let's disable for now
  // if (id === "frontend-collective-react-dnd-scrollzone") {
  //   return sz;
  // }

  // if (id === "react-dnd") {
  //   return reactdnd;
  // }

  // deck.gl and related libraries are loaded locally as well,
  // because we didn't get them to work via any of the CDNs (skypack etc.)
  // we use async imports so they're not part of the main bundle

  // We might want to remove hardcoded dependency for deckgl as we can't do this for every library.
  // Should fix the CDN resolver instead
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
