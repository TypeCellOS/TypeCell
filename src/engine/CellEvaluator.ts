import { autorun, observable } from "mobx";
import React from "react";
import { TypeCellContext } from "./context";
import {
  createExecutionScope,
  getModulesFromTypeCellCode,
  ModuleExecution,
  runModule,
} from "./engine";
import { isView } from "./view";

// const log = engineLogger;

export function createCellEvaluator(
  typecellContext: TypeCellContext,
  exposeGlobalVariables: { [key: string]: any },
  resolveImport: (module: string) => Promise<any>,
  setAndWatchOutput = true,
  onOutputChanged: (output: any) => void
) {
  let variableWatchDisposes: Array<() => void> = [];

  function clearVariableWatches() {
    variableWatchDisposes.forEach((d) => d());
    variableWatchDisposes = [];
  }

  function onExecuted(exports: any) {
    // log.debug("cellEvaluator onExecuted", cell.path);
    if (!setAndWatchOutput) {
      // for server side executions
      return;
    }
    const newExports = observable<any>({}); // TODO: is this nested observable and autorun necessary?
    for (let propertyName in exports) {
      variableWatchDisposes.push(
        autorun(() => {
          const exported = exports[propertyName];
          if (isView(exported)) {
            newExports[propertyName] = exported.view;
          } else if (propertyName === "default") {
            // TODO: this if is duplicated from engine.ts
            if (React.isValidElement(exports[propertyName])) {
              newExports[propertyName] = observable.box(exports[propertyName], {
                deep: false,
              });
            } else {
              newExports[propertyName] = exports[propertyName];
            }
          } else {
            newExports[propertyName] = typecellContext.context[propertyName];
          }
        })
      );
    }
    onOutputChanged(newExports);
  }

  function onError(error: any) {
    // log.warn("cellEvaluator onError", cell.path, error);
    onOutputChanged(error);
  }

  const executionScope = createExecutionScope(
    typecellContext,
    exposeGlobalVariables
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
        clearVariableWatches,
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
      clearVariableWatches();
    },
  };
}
