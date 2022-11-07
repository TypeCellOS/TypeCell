import { TypeCellContext } from "./context";
import { ModuleExecution, runModule } from "./executor";
import {
  createExecutionScope,
  getModulesFromPatchedTypeCellCode,
  getPatchedTypeCellCode,
} from "./modules";
import { isReactView } from "./reactView";

// const log = engineLogger;

export function assignExecutionExports(
  exports: any,
  typecellContext: TypeCellContext<any>
) {
  const newExports: any = {};
  for (let propertyName in exports) {
    if (propertyName === "default") {
      // default exports are not on typecellContext.context
      newExports.default = exports[propertyName];
    } else if (isReactView(exports[propertyName])) {
      Object.defineProperty(newExports, propertyName, {
        get: () => {
          return exports[propertyName];
        },
      });
    } else {
      // Create a shallow "getter" that just returns the variable from the typecellContext.
      // This way deep modifications and modifications from other cells ($.x = "val")
      // are reflected in Output
      delete newExports[propertyName];
      Object.defineProperty(newExports, propertyName, {
        get: () => {
          return typecellContext.context[propertyName];
        },
      });
    }
  }
  return newExports;
}

export function createCellEvaluator(
  typecellContext: TypeCellContext<any>,
  resolveImport: (module: string) => Promise<any>,
  setAndWatchOutput = true,
  onOutputChanged: (output: any) => void,
  beforeExecuting: () => void
) {
  function onExecuted(exports: any) {
    // log.debug("cellEvaluator onExecuted", cell.path);
    if (!setAndWatchOutput) {
      // for server side executions
      return;
    }
    const newExports = assignExecutionExports(exports, typecellContext);
    onOutputChanged(newExports);
  }

  function onError(error: any) {
    // log.warn("cellEvaluator onError", cell.path, error);
    onOutputChanged(error);
  }

  const executionScope = createExecutionScope(typecellContext);
  let moduleExecution: ModuleExecution | undefined;

  async function evaluate(compiledCode: string) {
    if (moduleExecution) {
      moduleExecution.dispose();
    }

    try {
      // log.debug("getModulesFromTypeCellCode", cell.path);
      const patchedCode = getPatchedTypeCellCode(compiledCode, executionScope);
      const modules = getModulesFromPatchedTypeCellCode(
        patchedCode,
        executionScope
      );

      if (modules.length !== 1) {
        throw new Error("expected exactly 1 module");
      }

      // log.debug("runModule", cell.path);
      moduleExecution = await runModule(
        modules[0],
        typecellContext,
        resolveImport,
        beforeExecuting,
        onExecuted,
        onError,
        moduleExecution?.disposeVariables
      );
      await moduleExecution.initialRun;
    } catch (e) {
      console.error(e);
      // log.warn("cellEvaluator error evaluating", cell.path, e);
      onOutputChanged(e);
    }
  }

  return {
    evaluate,
    dispose: () => {
      // log.debug("cellEvaluator dispose", cell.path);
      if (moduleExecution) {
        moduleExecution.dispose();
        moduleExecution.disposeVariables();
      }
    },
  };
}
