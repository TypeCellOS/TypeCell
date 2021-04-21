import { TypeCellContext } from "./context";
import {
  createExecutionScope,
  getModulesFromTypeCellCode,
  ModuleExecution,
  runModule,
} from "./engine";

// const log = engineLogger;

export function createCellEvaluator(
  typecellContext: TypeCellContext,
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
    const newExports: any = {};
    for (let propertyName in exports) {
      if (propertyName === "default") {
        // default exports are not on typecellContext.context
        newExports.default = exports[propertyName];
      } else {
        // Create a shallow "getter" that just returns the variable from the typecellContext.
        // This way deep modifications are reflected in Output
        delete newExports[propertyName];
        Object.defineProperty(newExports, propertyName, {
          get: () => {
            return typecellContext.context[propertyName];
          },
        });
      }
    }
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
      const modules = getModulesFromTypeCellCode(compiledCode, executionScope);
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
