import * as engine from "@typecell-org/engine";
import { observable, ObservableMap } from "mobx";
import type { IContext } from "../src-notebook/types/context";
import { ModelOutput } from "./components/ModelOutput";
import cellFunctions from "./generated/cellFunctions";
import { resolveImport } from "./generated/resolveImport";

async function initialize(
  ctx: engine.TypeCellContext<any>,
  modules: Array<engine.modules.Module & { name: string }>,
  outputs: ObservableMap<string, ModelOutput>
) {
  for (let module of modules) {
    let modelOutput = new ModelOutput(ctx);
    outputs.set(module.name, modelOutput);

    const execution = await engine.runModule(
      module,
      ctx,
      resolveImport,
      () => {
        console.info("(re)evaluating cell");
      },
      (exports) => {
        console.info("evaluated cell");
        const output = engine.assignExecutionExports(exports, ctx);
        modelOutput.updateValue(output);
      },
      (error) => {
        console.error(error);
        // cell.output = error;
        modelOutput.updateValue(error);
      }
    );
    await execution.initialRun;
  }
}

export function getNotebook() {
  const ctx = engine.createContext<IContext>();
  const scope = engine.modules.createExecutionScope(ctx);

  const modules = cellFunctions.flatMap((cellFunction) =>
    engine.modules.getModulesFromWrappedPatchedTypeCellFunction(
      cellFunction,
      scope
    )
  );

  const modulesWithName = modules.map((mod, i) => ({
    ...mod,
    name: typeof mod.name === "string" ? mod.name : "module_" + i,
  }));

  const outputs = observable.map<string, ModelOutput>(undefined, {
    deep: false,
  });

  return {
    context: ctx,
    initializeResult: initialize(ctx, modulesWithName, outputs),
    modules: modulesWithName,
    outputs,
  };
}
