import { autorun, computed, observable, untracked } from "mobx";
import { TypeCellContext } from "./context";
// import { stored } from "./storage/stored";
// import { view } from "./view";

export const unnamedModule = Symbol("unnamed");

export type Module = {
  name: string | typeof unnamedModule;
  dependencyArray: string[];
  factoryFunction: Function;
};

/**
 * for compiled format, e.g.:

 export default () =>
  define(["require", "exports", "lodash"], async function (
    require,
    exports,
    lodash_1
  ) {
    ...
  }
 */
export function getModulesFromWrappedPatchedTypeCellFunction(
  caller: () => any,
  scope: any
): Module[] {
  const modules: Module[] = [];
  const define = createDefine(modules);
  caller.apply({ ...scope, define });
  return modules;
}

/**
 * for editor / repl format, where code is a string
 * prepared by getPatchedTypeCellCode
 */
export function getModulesFromPatchedTypeCellCode(
  code: string,
  scope: any
): Module[] {
  const modules: Module[] = [];
  const define = createDefine(modules);
  // eslint-disable-next-line
  const f = new Function(code);
  f.apply({ ...scope, define });
  return modules;
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

export function createExecutionScope(context: TypeCellContext<any>) {
  const scope = {
    autorun,
    $: context.context,
    $views: context.viewContext,
    untracked,
    computed,
    // editor: globalEditor,
    // stored,
    // view,
    observable,
  };
  return scope;
}

export function getPatchedTypeCellCode(compiledCode: string, scope: any) {
  // Checks if define([], function) like code is already present
  if (!compiledCode.match(/(define\((".*", )?\[.*\], )function/gm)) {
    // file is not a module (no exports). Create module-like code manually
    compiledCode = `define([], function() { ${compiledCode}; });`;
  }

  if (Object.keys(scope).find((key) => !/^[a-zA-Z0-9_$]+$/.test(key))) {
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
    /^\s*(define\((".*", )?\[.*\], )function/gm,
    "$1async function"
  ); // TODO: remove await?

  return totalCode;
}
