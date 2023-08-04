import type * as monaco from "monaco-editor";
import { detectNewImportsToAcquireTypeFor } from "./typeAcquisition";

export function acquireTypes(code: string, monacoInstance: typeof monaco) {
  detectNewImportsToAcquireTypeFor(
    code,
    (code: string, path: string) => {
      // console.log("addlib", path);
      monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
        code,
        path
      );
    },
    window.fetch.bind(window),
    console // TODO
  );
}

export default function setupNpmTypeResolver(monacoInstance: typeof monaco) {
  monacoInstance.editor.onDidCreateModel((model) => {
    if (!model.uri.path.startsWith("/!")) {
      return;
    }

    // TODO: check language

    model.onDidChangeContent(() => {
      acquireTypes(model.getValue(), monacoInstance);
    });
    acquireTypes(model.getValue(), monacoInstance);
  });

  // always import react types, as this library is imported by default in ts.worker
  acquireTypes(`import * as React from "react"`, monacoInstance);
}
