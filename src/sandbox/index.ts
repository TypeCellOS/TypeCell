// stripped down version of https://github.com/microsoft/TypeScript-Website/tree/v2/packages/sandbox

import type * as Monaco from "monaco-editor";
// @ts-ignore
import EditorWorker from "workerize-loader!./workers/editor.worker"; // eslint-disable-line import/no-webpack-loader-syntax
// @ts-ignore
import TsWorker from "workerize-loader!./workers/ts.worker"; // eslint-disable-line import/no-webpack-loader-syntax

import { getDefaultSandboxCompilerOptions } from "./compilerOptions";

(window as any).MonacoEnvironment = {
  getWorker: function (workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") {
      return new TsWorker();
    }
    if (label === "json") {
      throw new Error("not implemented");
    }
    if (label === "css" || label === "scss" || label === "less") {
      throw new Error("not implemented");
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      throw new Error("not implemented");
    }
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.bundle.js";
    }
    return new EditorWorker();
  },
};

// Basically android and monaco is pretty bad, this makes it less bad
// See https://github.com/microsoft/pxt/pull/7099 for this, and the long
// read is in https://github.com/microsoft/monaco-editor/issues/563
// const isAndroid = navigator && /android/i.test(navigator.userAgent);

/** Default Monaco settings for playground 
const sharedEditorOptions: Monaco.editor.IEditorOptions = {
  scrollBeyondLastLine: true,
  scrollBeyondLastColumn: 3,
  minimap: {
    enabled: false,
  },
  lightbulb: {
    enabled: true,
  },
  quickSuggestions: {
    other: !isAndroid,
    comments: !isAndroid,
    strings: !isAndroid,
  },
  acceptSuggestionOnCommitCharacter: !isAndroid,
  acceptSuggestionOnEnter: !isAndroid ? "on" : "off",
  accessibilitySupport: !isAndroid ? "on" : "off",
};*/

/** Creates a sandbox editor, and returns a set of useful functions and the editor */
export const setMonacoDefaults = (monaco: typeof Monaco) => {
  // const getWorker = monaco.languages.typescript.getTypeScriptWorker;

  const defaults = monaco.languages.typescript.typescriptDefaults;

  defaults.setDiagnosticsOptions({
    ...defaults.getDiagnosticsOptions(),
    noSemanticValidation: false,
    // This is when tslib is not found
    diagnosticCodesToIgnore: [2354, 1108, 1378], // TODO: move except 2354, should probably be passed in from sandbox consumer
  });

  let compilerOptions = {
    ...getDefaultSandboxCompilerOptions(
      { useJavaScript: false },
      monaco.languages.typescript
    ),
  };
  defaults.setCompilerOptions(compilerOptions);

  monaco.editor.defineTheme("typecellTheme", {
    base: "vs", // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    colors: {
      "editor.background": "#f4f5f7",
    },
    rules: [{ background: "#f4f5f7" } as any],
  });
};
