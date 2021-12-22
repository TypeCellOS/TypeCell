import {
  CodeModel,
  Engine,
  ResolvedImport,
  SkypackResolver,
} from "@typecell-org/engine";
import * as markdownit from "markdown-it";
import * as react from "react";
import * as reactdnd from "react-dnd";
import * as reactdom from "react-dom";
import * as probe from "probe.gl";
import * as dreact from "@deck.gl/react";

import getExposeGlobalVariables from "../lib/exports";
import { TypeCellCompiledCodeProvider } from "./typecell/TypeCellCompiledCodeProvider";

const agg = require("@deck.gl/aggregation-layers") as any;
const lutil = require("@loaders.gl/core") as any;
const limg = require("@loaders.gl/images") as any;
const sz = require("frontend-collective-react-dnd-scrollzone");

// TODO: make async
function resolveNestedModule(id: string) {
  function isModule(id: string, moduleName: string) {
    return id === moduleName || id === "https://cdn.skypack.dev/" + moduleName;
  }

  if (isModule(id, "markdown-it")) {
    return markdownit;
  }

  if (isModule(id, "react")) {
    return react;
  }

  if (isModule(id, "react-dom")) {
    return reactdom;
  }

  if (isModule(id, "frontend-collective-react-dnd-scrollzone")) {
    return sz;
  }

  if (isModule(id, "react-dnd")) {
    return reactdnd;
  }

  // We might want to remove hardcoded dependency for deckgl... We can't do this for every library..

  if (isModule(id, "@deck.gl/react")) {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return dreact;
  }

  if (isModule(id, "probe.gl")) {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return probe;
  }

  if (isModule(id, "@loaders.gl/core")) {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return lutil;
  }

  if (isModule(id, "@deck.gl/aggregation-layers")) {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return agg;
  }

  if (isModule(id, "@loaders.gl/images")) {
    // workaround for https://github.com/skypackjs/skypack-cdn/issues/242
    return limg;
  }

  return undefined;
}

const skypackResolver = new SkypackResolver(resolveNestedModule);

// todo: caches

const cache = new Map<string, ResolvedImport>();

export function getTypeCellResolver<T extends CodeModel>(
  documentId: string,
  cacheKey: string,
  createTypeCellCompiledCodeProvider?: (
    moduleName: string
  ) => TypeCellCompiledCodeProvider
) {
  // TODO: probably we can just use a random id here, or refactor this all to use class + local cache
  const resolveImportNested = async (
    moduleName: string,
    forModel: T
  ): Promise<ResolvedImport> => {
    if (moduleName === "typecell") {
      return {
        module: {
          default: getExposeGlobalVariables(documentId),
        },
        dispose: () => {},
      };
    }
    const resolved = await resolveImport(
      moduleName,
      cacheKey + "$$" + forModel.path,
      createTypeCellCompiledCodeProvider
    );

    return resolved;
  };
  return resolveImportNested;
}

async function resolveImport(
  moduleName: string,
  cacheKey: string,
  createTypeCellCompiledCodeProvider?: (
    moduleName: string
  ) => TypeCellCompiledCodeProvider
): Promise<ResolvedImport> {
  if (!moduleName.startsWith("!@")) {
    return skypackResolver.resolveImport(moduleName);
  }

  if (!createTypeCellCompiledCodeProvider) {
    throw new Error("typecell modules not supported");
  }

  const key = [cacheKey, moduleName].join("$$");

  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  const provider = createTypeCellCompiledCodeProvider(moduleName);

  const engine = new Engine(
    getTypeCellResolver(moduleName, key, createTypeCellCompiledCodeProvider)
  );

  engine.registerModelProvider(provider);

  let disposed = false;
  const ret = {
    module: engine.observableContext.context,
    dispose: () => {
      if (disposed) {
        throw new Error("already disposed");
      }
      cache.delete(key);
      disposed = true;
      engine.dispose();
      provider.dispose();
    },
  };
  cache.set(key, ret);
  return ret;
}
