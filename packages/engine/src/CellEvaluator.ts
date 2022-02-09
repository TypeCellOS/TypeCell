import { TypeCellContext } from "./context";
import { ConsolePayload } from "./Engine";
import { ModuleExecution, runModule } from "./executor";
import { HookExecution } from "./HookExecution";
import { createExecutionScope, getModulesFromTypeCellCode } from "./modules";
import { isReactView } from "./reactView";

// const log = engineLogger;

export function createCellEvaluator(
  typecellContext: TypeCellContext<any>,
  resolveImport: (module: string) => Promise<any>,
  setAndWatchOutput = true,
  onOutputEvent: (output: any) => void,
  onConsoleEvent: (console: ConsolePayload) => void,
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
    onOutputEvent(newExports);
  }

  function onError(error: any) {
    // log.warn("cellEvaluator onError", cell.path, error);
    onOutputEvent(error);
  }

  const hookExecution = new HookExecution(onConsoleEvent);
  const executionScope = createExecutionScope(
    typecellContext,
    hookExecution.context
  );
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
        hookExecution,
        beforeExecuting,
        onExecuted,
        onError,
        moduleExecution?.disposeVariables
      );
      await moduleExecution.initialRun;
    } catch (e) {
      console.error(e);
      // log.warn("cellEvaluator error evaluating", cell.path, e);
      onOutputEvent(e);
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
