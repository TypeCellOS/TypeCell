import * as engine from "@typecell-org/engine";
import * as mobx from "mobx";
import type { IContext } from "../src-notebook/types/context";
import cellFunctions from "./generated/cellFunctions";
import { resolveImport } from "./generated/resolveImport";

type ExecutableCell = {
  module: engine.modules.Module;
  output: {};
};

async function initialize(
  ctx: engine.TypeCellContext<any>,
  executableCells: ExecutableCell[]
) {
  for (let cell of executableCells) {
    const execution = await engine.runModule(
      cell.module,
      ctx,
      resolveImport,
      () => {
        console.info("(re)evaluating cell");
      },
      (exports) => {
        console.info("evaluated cell");
        cell.output = engine.assignExecutionExports(exports, ctx);
      },
      (error) => {
        console.error(error);
        cell.output = error;
      }
    );
    await execution.initialRun;
  }
}

export function getNotebook() {
  const ctx = engine.createContext<IContext>();
  const scope = engine.modules.createExecutionScope(ctx);

  const cells = cellFunctions
    .flatMap((cell) => {
      return engine.modules.getModulesFromWrappedPatchedTypeCellFunction(
        cell,
        scope
      );
    })
    .map((module) => {
      return {
        module,
        output: mobx.observable(
          {
            output: {},
          },
          undefined,
          { deep: false }
        ),
      };
    });

  return {
    context: ctx,
    initializeResult: initialize(ctx, cells),
    cells,
  };
}
