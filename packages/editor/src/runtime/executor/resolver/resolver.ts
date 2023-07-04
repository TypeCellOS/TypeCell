import {
  CodeModel,
  Engine,
  // JSPMResolver,
  ESMshResolver,
  ImportShimResolver,
  ResolvedImport,
  SkypackResolver,
} from "@typecell-org/engine";
import getExposeGlobalVariables from "../lib/exports";
import * as jsxRuntime from "../lib/jsx";
import { LocalResolver } from "./LocalResolver";
import { TypeCellCompiledCodeProvider } from "./typecell/TypeCellCompiledCodeProvider";
// Used for resolving NPM imports
const esmshResolver = new ESMshResolver();
const skypackResolver = new SkypackResolver();
// const jspmResolver = new JSPMResolver();
const importShimResolver = new ImportShimResolver(
  [esmshResolver, skypackResolver],
  LocalResolver
);

const cache = new Map<string, ResolvedImport>();

/**
 * The resolver is responsible for resolving imports from user code.
 *
 * This resolver supports the following:
 *
 * 1. TypeCell library imports
 *
 *  import * as typecell from "typecell";
 *
 * This resolves to the object from ../lib/exports
 *
 * 2. NPM imports
 *
 *  import * as _ from "lodash";
 *
 * This uses the `importShimResolver` to resolve the module via Skypack
 * (with some exceptions that are loaded locally via LocalResolver)
 *
 * 3. TypeCell Notebook imports
 *
 *  import * as nb from "!@username/notebook"
 *
 * This loads a notebook from TypeCell + compiles and executes it whenever it changes
 */
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
      // Resolve the typecell helper library
      return {
        module: {
          default: getExposeGlobalVariables(documentId),
        },
        dispose: () => {},
      };
    } else if (moduleName === "typecell/jsx-runtime") {
      return {
        module: jsxRuntime,
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
    // It's a regular NPM import like `import * as _ from "lodash"`;
    return importShimResolver.resolveImport(moduleName);
  }

  // We're loading a TypeCell notebook (e.g.: `import * as nb from "!@user/notebook"`)
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
