import {
  CodeModel,
  Engine,
  ImportShimResolver,
  ResolvedImport,
  SkypackResolver,
} from "@typecell-org/engine";
import getExposeGlobalVariables from "../lib/exports";
import { LocalResolver } from "./LocalResolver";
import { TypeCellCompiledCodeProvider } from "./typecell/TypeCellCompiledCodeProvider";

const skypackResolver = new SkypackResolver();
const importShimResolver = new ImportShimResolver(
  [skypackResolver],
  LocalResolver
);

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
    return importShimResolver.resolveImport(moduleName);
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
