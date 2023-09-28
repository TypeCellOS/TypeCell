import { RunContext } from "@typecell-org/engine";
import { CodeModel } from "@typecell-org/shared";
import { EditorStore } from "../../../EditorStore";
import getExposeGlobalVariables from "../lib/exports";

export async function TypeCellHelperLibraryResolver(
  moduleName: string,
  forModelList: CodeModel[],
  runContext: RunContext,
  editorStore: EditorStore,
) {
  if (moduleName === "typecell") {
    // Resolve the typecell helper library
    return {
      module: {
        __esModule: true,
        default: getExposeGlobalVariables(
          runContext,
          editorStore,
          forModelList,
        ),
      },
      dispose: () => {
        // Do nothing
      },
    };
  }
  return undefined;
}
