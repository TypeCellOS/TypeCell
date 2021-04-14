type TS = typeof import("monaco-editor").languages.typescript;
type CompilerOptions = import("monaco-editor").languages.typescript.CompilerOptions;

/**
 * These are the defaults, but they also act as the list of all compiler options
 * which are parsed in the query params.
 */
export function getDefaultSandboxCompilerOptions(
  config: { useJavaScript: boolean },
  typescript: Pick<
    TS,
    "ScriptTarget" | "ModuleResolutionKind" | "JsxEmit" | "ModuleKind"
  >
) {
  const settings: CompilerOptions = {
    noImplicitAny: true,
    strictNullChecks: !config.useJavaScript,
    strictFunctionTypes: true,
    strictPropertyInitialization: true,
    strictBindCallApply: true,
    noImplicitThis: true,
    noImplicitReturns: true,
    noUncheckedIndexedAccess: false,

    // 3.7 off, 3.8 on I think
    useDefineForClassFields: false,

    alwaysStrict: true,
    allowUnreachableCode: false,
    allowUnusedLabels: false,

    downlevelIteration: false,
    noEmitHelpers: false,
    noLib: false,
    noStrictGenericChecks: false,
    noUnusedLocals: false,
    noUnusedParameters: false,

    esModuleInterop: false,
    preserveConstEnums: false,
    removeComments: false,
    skipLibCheck: false,

    checkJs: config.useJavaScript,
    allowJs: config.useJavaScript,
    declaration: true,

    importHelpers: false,

    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,

    target: typescript.ScriptTarget.ES2017,
    jsx: typescript.JsxEmit.React,
    module: typescript.ModuleKind.AMD,
  };

  return settings;
}
