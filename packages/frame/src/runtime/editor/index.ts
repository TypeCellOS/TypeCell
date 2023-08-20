// stripped down version of https://github.com/microsoft/TypeScript-Website/tree/v2/packages/sandbox

import type * as Monaco from "monaco-editor";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import EditorWorker from "./workers/editor.worker?worker"; // eslint-disable-line import/no-webpack-loader-syntax
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TsWorker from "./workers/ts.worker?sharedworker"; // eslint-disable-line import/no-webpack-loader-syntax
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import CSSWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";

import { getDefaultSandboxCompilerOptions } from "./compilerOptions";
import { setupPrettier } from "./prettier";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(window as any).MonacoEnvironment) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).MonacoEnvironment = (global as any).MonacoEnvironment = {
    getWorker: function (workerId: string, label: string) {
      if (label === "typescript" || label === "javascript") {
        const w = new TsWorker(); // TsWorker();
        // w.port.start();

        return {
          postMessage: w.port.postMessage.bind(w.port),
          addEventListener: w.port.addEventListener.bind(w.port),
          removeEventListener: w.port.removeEventListener.bind(w.port),
          terminate: () => {
            // noop
          },
          get onmessage() {
            return w.port.onmessage;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set onmessage(val: any) {
            w.port.onmessage = val;
          },
          get onmessageerror() {
            return w.port.onmessageerror;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set onmessageerror(val: any) {
            w.port.onmessageerror = val;
          },
        };
      }
      if (label === "json") {
        throw new Error("not implemented");
      }
      if (label === "css" || label === "scss" || label === "less") {
        return new CSSWorker();
      }
      if (label === "html" || label === "handlebars" || label === "razor") {
        throw new Error("not implemented");
      }
      return new EditorWorker();
    },
  };
}

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monaco.editor.EditorOptions.minimap.defaultValue = { enabled: false } as any;
  monaco.editor.EditorOptions.scrollBeyondLastLine.defaultValue = false;
  monaco.editor.EditorOptions.overviewRulerLanes.defaultValue = 0;
  monaco.editor.EditorOptions.lineNumbersMinChars.defaultValue = 3;

  // monaco.editor.EditorOptions.lineNumbers.defaultValue = 1 as any;
  // monaco.editor.EditorOptions.tab.defaultValue = 2;
  monaco.editor.EditorOptions.scrollbar.defaultValue = {
    ...monaco.editor.EditorOptions.scrollbar.defaultValue,
    alwaysConsumeMouseWheel: false,
  };

  monaco.editor.EditorOptions.formatOnPaste.defaultValue = true;
  const defaults = monaco.languages.typescript.typescriptDefaults;

  defaults.setDiagnosticsOptions({
    ...defaults.getDiagnosticsOptions(),
    noSemanticValidation: false,
    // This is when tslib is not found
    diagnosticCodesToIgnore: [2354, 1108, 1378], // TODO: move except 2354, should probably be passed in from sandbox consumer
  });

  const compilerOptions = {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rules: [{ background: "#f4f5f7" } as any],
  });
  setupPrettier(monaco);
};
