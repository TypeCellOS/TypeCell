import { autorun, observable, runInAction, untracked } from "mobx";
import React from "react";
import { TypeCellContext } from "./context";
import { installHooks } from "./hookDisposables";
import { isStored, stored } from "./storage/stored";
import { isView, view } from "./view";

const unnamedModule = Symbol("unnamed");

type Module = {
  name: string | typeof unnamedModule;
  dependencyArray: string[];
  factoryFunction: Function;
};

function getModulesFromCode(code: string, scope: any): Module[] {
  const modules: Module[] = [];
  const define = createDefine(modules);
  const f = new Function(code);
  f.apply({ ...scope, define });
  return modules;
}

async function resolveDependencyArray(
  dependencyArray: string[],
  context: TypeCellContext,
  resolveImport: (module: string) => any,
  exports: any,
  userDisposes: Array<() => void>
) {
  return await Promise.all(
    dependencyArray.map((arg) => {
      if (arg === "exports") {
        return exports;
      }
      if (arg === "require") {
        return function () {
          return resolveImport(
            // cell,
            arguments[0][0]
          ).then(arguments[1], arguments[2]);
        };
        // return new Function("import(arguments[0][0]).then(arguments[1], arguments[2]);");
      }
      if (arg === "./input") {
        return context;
      }

      // TODO: this is hacky, would rather
      // (a) have a global dispose() method
      // (b) move all globals (see scope below) to typecellutils
      if (arg === "typecellutils") {
        return {
          dispose: (disposer: () => void) => {
            userDisposes.push(() => {
              try {
                disposer();
              } catch (e) {
                // engineLogger.warn("error in user defined dispose", e);
              }
            });
          },
        };
      }
      return resolveImport(arg);
    })
  );
}

function createDefine(modules: Module[]) {
  return function typeCellDefine(
    moduleNameOrDependencyArray: string | string[],
    dependencyArrayOrFactoryFunction: string[] | Function,
    factoryFunction?: Function
  ) {
    const moduleName: string | typeof unnamedModule =
      typeof moduleNameOrDependencyArray === "string"
        ? moduleNameOrDependencyArray
        : unnamedModule;
    const dependencyArray: string[] =
      typeof moduleNameOrDependencyArray === "string"
        ? dependencyArrayOrFactoryFunction
        : (moduleNameOrDependencyArray as any);
    const func =
      factoryFunction || (dependencyArrayOrFactoryFunction as Function);

    modules.push({
      name: moduleName,
      dependencyArray: dependencyArray,
      factoryFunction: func,
    });
  };
}

export type ModuleExecution = {
  initialRun: Promise<any>;
  dispose: () => void;
};

export async function runModule(
  mod: Module,
  context: TypeCellContext,
  resolveImport: (module: string) => any,
  beforeExecuting: () => void,
  onExecuted: (exports: any) => void,
  onError: (error: any) => void
): Promise<ModuleExecution> {
  let disposeOnCodeChange: Array<() => void> = [];
  let disposeEveryRun: Array<() => void> = [];

  const exports: any = {};
  const argsToCallFunctionWith = await resolveDependencyArray(
    mod.dependencyArray,
    context,
    resolveImport,
    exports,
    disposeEveryRun
  );

  let initialRun = true;
  let resolve: (value?: any) => void;
  let reject: (error: any) => void;

  const promise = new Promise((resolver, rejecter) => {
    resolve = resolver;
    reject = rejecter;
  });

  let createdAt = Date.now();

  disposeOnCodeChange.push(
    autorun(
      async () => {
        try {
          // trace(false);
          if (initialRun) {
            // log.debug("engine initial run", cell.id); //, func + "");
          } else {
            // log.debug("engine autorun", cell.id, createdAt); //, func + "");
          }
          initialRun = false;

          disposeEveryRun.forEach((d) => d());
          disposeEveryRun.length = 0; // clear existing array in this way, because we've passed the reference to resolveDependencyArray and want to keep it intact

          beforeExecuting();
          const hooks = installHooks();
          disposeEveryRun.push(hooks.disposeAll);
          let executionPromise: Promise<any>;
          try {
            executionPromise = mod.factoryFunction.apply(
              undefined,
              argsToCallFunctionWith
            ); // TODO: what happens with disposers if a rerun of this function is slow / delayed?
          } finally {
            // Hooks are only installed for sync code. Ideally, we'd want to run it for all code, but then we have the chance hooks will affect other parts of the TypeCell (non-user) code
            // (we ran into this that notebooks wouldn't be saved (_.debounce), and also that setTimeout of Monaco blink cursor would be hooked)
            hooks.unHookAll();
          }

          await executionPromise;

          // Running the assignments to `context` in action should be a performance improvement to prevent triggering observers one-by-one
          runInAction(() => {
            for (var propertyName in exports) {
              // log.log(cell.id, "exported property:", propertyName, exports[propertyName]);

              const saveValue = (exported: any) => {
                if (propertyName !== "default") {
                  if (isStored(exported)) {
                    // context.storage.addStoredValue(propertyName, exported);
                  } else {
                    // context.storage.removeStoredValue(propertyName);
                    if (React.isValidElement(exported)) {
                      context.context[propertyName] = observable.box(exported, {
                        deep: false,
                      });
                    } else {
                      context.context[propertyName] = exported;
                    }
                  }
                }
              };

              let exported = exports[propertyName];
              if (isView(exported)) {
                disposeEveryRun.push(autorun(() => saveValue(exported.value)));
              } else {
                saveValue(exported);
              }
            }
          });

          // TODO: should we use a different dispose logic for this? E.g. every run: dispose context variables that are not set? because exceptions in code could change exported values. Or should we disposeOnCodeChange on errors?
          disposeOnCodeChange.push(() => {
            runInAction(() => {
              for (var propertyName in exports) {
                delete context.context[propertyName];
                // TODO: stored
              }
            });
          });
          onExecuted(exports);
          resolve();
        } catch (e) {
          onError(e);
          //reject(e);
          resolve();
        }
      },
      {
        // name: cell.id,
      }
    )
  );

  return {
    initialRun: promise,
    dispose: () => {
      disposeOnCodeChange.forEach((d) => d());
      disposeOnCodeChange = [];

      disposeEveryRun.forEach((d) => d());
      disposeEveryRun = [];
    },
  };
}

export function createExecutionScope(
  context: TypeCellContext,
  exposeGlobalVariables: { [key: string]: any }
) {
  const scope = {
    ...exposeGlobalVariables,
    autorun,
    $: context.context,
    untracked,
    // editor: globalEditor,
    stored,
    view,
    observable,
  };
  return scope;
}

export function getModulesFromTypeCellCode(compiledCode: string, scope: any) {
  if (!compiledCode.match(/^(define\((".*", )?\[.*\], )function/gm)) {
    // file is not a module (no exports). Create module-like code manually
    compiledCode = `define([], function() {
${compiledCode};
          });   
`;
  }

  if (Object.keys(scope).find((key) => !/^[a-zA-Z0-9_\$]+$/.test(key))) {
    throw new Error("invalid key on scope!");
  }

  let variableImportCode = Object.keys(scope)
    .map((key) => `let ${key} = this.${key};`)
    .join("\n");

  let totalCode = `;
let define = this.define;
${variableImportCode}
${compiledCode}
`;

  totalCode = totalCode.replace(
    /^(define\((".*", )?\[.*\], )function/gm,
    "$1async function"
  ); // TODO: remove await?

  return getModulesFromCode(totalCode, scope);
}
