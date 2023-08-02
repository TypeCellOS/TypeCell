import getExposeGlobalVariables from "../lib/exports";

export async function TypeCellHelperLibraryResolver(moduleName: string) {
  if (moduleName === "typecell") {
    // Resolve the typecell helper library
    return {
      module: {
        default: getExposeGlobalVariables(),
      },
      dispose: () => {},
    };
  }
  return undefined;
}
