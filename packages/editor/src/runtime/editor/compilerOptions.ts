import type * as Monaco from "monaco-editor";

type TS = typeof Monaco.languages.typescript;
type CompilerOptions = Monaco.languages.typescript.CompilerOptions;
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

    allowSyntheticDefaultImports: false,
    esModuleInterop: false,
    preserveConstEnums: false,
    removeComments: false,
    skipLibCheck: true,

    checkJs: config.useJavaScript,
    allowJs: config.useJavaScript,
    declaration: true,

    importHelpers: false,

    experimentalDecorators: false,
    emitDecoratorMetadata: false,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,

    target: typescript.ScriptTarget.ES2020,
    jsx: typescript.JsxEmit.React,
    module: typescript.ModuleKind.AMD,
    // jsxFactory: "h",
    // jsxImportSource: "typecell",

    // typeRoots: ["node_modules/@types"],
  };

  return settings;
}
