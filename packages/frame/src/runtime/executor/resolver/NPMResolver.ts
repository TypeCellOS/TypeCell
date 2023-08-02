import {
  ESMshResolver,
  ImportShimResolver,
  SkypackResolver,
} from "@typecell-org/engine";
import { LocalResolver } from "./LocalResolver";

// Used for resolving NPM imports
const esmshResolver = new ESMshResolver();
const skypackResolver = new SkypackResolver();
// const jspmResolver = new JSPMResolver();
const importShimResolver = new ImportShimResolver(
  [esmshResolver, skypackResolver],
  LocalResolver
);

export async function NPMLibraryResolver(moduleName: string) {
  return importShimResolver.resolveImport(moduleName);
}
