import { autorun, runInAction } from "mobx";
import { TypeCellContext } from "./context";
import { installHooks } from "./hookDisposables";
import { Module } from "./modules";
import { isStored } from "./storage/stored";
import { isView } from "./view";

async function resolveDependencyArray(
  dependencyArray: string[],
  context: TypeCellContext<any>,
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

export type ModuleExecution = {
  initialRun: Promise<any>;
  dispose: () => void;
  disposeVariables: (newExportsToKeep?: any) => void;
};

export async function runModule(
  mod: Module,
  context: TypeCellContext<any>,
  resolveImport: (module: string) => any,
  beforeExecuting: () => void,
  onExecuted: (exports: any) => void,
  onError: (error: any) => void,
  previousVariableDisposer?: (newExportsToKeep: any) => void
): Promise<ModuleExecution> {
  let cleanVariablesFromContext: Array<(newExports: any) => void> = [];
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

  const promise = new Promise((resolver, rejecter) => {
    resolve = resolver;
  });

  // let createdAt = Date.now();
  let wouldLoopOnAutorun = false;
  let detectedLoop = false;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes("typecell.org") || hostname.includes("typecell.com")) {
    throw new Error(
      "failed security check, executor can not be running on these domains"
    );
  }

  const execute = async () => {
    try {
      if (wouldLoopOnAutorun) {
        detectedLoop = true;
        throw new Error("loop detected (child run)");
      }
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
        if (previousVariableDisposer) {
          previousVariableDisposer(exports);
        }
      }

      await executionPromise;

      // Running the assignments to `context` in action should be a performance improvement to prevent triggering observers one-by-one
      wouldLoopOnAutorun = true;
      runInAction(() => {
        for (let propertyName in exports) {
          // log.log(cell.id, "exported property:", propertyName, exports[propertyName]);

          const saveValue = (exported: any) => {
            if (propertyName !== "default") {
              if (isStored(exported)) {
                // context.storage.addStoredValue(propertyName, exported);
              } else {
                context.rawContext[propertyName] = exported;
              }
            }
          };

          let exported = exports[propertyName];
          if (isView(exported)) {
            disposeEveryRun.push(autorun(() => saveValue(exported.value)));
            // } else if (isReactView(exported)) {
            //   // debugger;
            //   // disposeEveryRun.push(
            //   //   autorun(() => saveValue(getReactViewValue(exported)))
            //   // );

            //   const previousSetter = Object.getOwnPropertyDescriptor(
            //     context.context,
            //     propertyName
            //   )?.set;

            //   Object.defineProperty(context.context, propertyName, {
            //     configurable: true,
            //     get: () => {
            //       const val = getReactViewValue<any>(exported).get();
            //       return val;
            //     },
            //     set: (v: any) => {
            //       // make sure that when assigning to $.val, we call getReactViewValue($.val).set instead
            //       // e.g.: another cell assigns $.inputText = "newVal"
            //       getReactViewValue<any>(exported).set(v);
            //     },
            //   });
            //   // make sure the get() methods on the context reevaluate, by resetting the previous value
            //   // (you can test this by defining input(<input type="text" defaultValue="xxx") and changing defaultValue
            //   if (previousSetter) {
            //     previousSetter(Math.random());
            //   }
          } else {
            saveValue(exported);
          }
        }
      });

      cleanVariablesFromContext.push((newExports: any) => {
        runInAction(() => {
          for (let propertyName in exports) {
            if (!(propertyName in newExports)) {
              // don't clean variables that are already exported, we will just overwrite them later in the runInAction above
              delete context.context[propertyName];
            }
            // TODO: stored
          }
        });
      });
      wouldLoopOnAutorun = false;

      if (detectedLoop) {
        throw new Error(
          "loop detected (parent run). Are you referencing an exported variable with $ in the same cell?"
        );
      }
      onExecuted(exports);
      resolve();
    } catch (e) {
      onError(e);
      //reject(e);
      resolve();
    }
  };

  const autorunDisposer = autorun(() => execute());

  return {
    initialRun: promise,
    disposeVariables: (newExportsToKeep: any = {}) => {
      cleanVariablesFromContext.forEach((d) => d(newExportsToKeep));
      cleanVariablesFromContext = [];
    },
    dispose: () => {
      autorunDisposer();

      disposeEveryRun.forEach((d) => d());
      disposeEveryRun = [];
    },
  };
}
