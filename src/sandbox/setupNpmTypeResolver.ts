import * as monaco from "monaco-editor";
import { detectNewImportsToAcquireTypeFor } from "./typeAcquisition";

const addLibraryToRuntime = (code: string, path: string) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(code, path);
};

export function acquireTypes(code: string) {
  detectNewImportsToAcquireTypeFor(
    code,
    addLibraryToRuntime,
    window.fetch.bind(window),
    console // TODO
  );
}

export default function setupNpmTypeResolver() {
  monaco.editor.onDidCreateModel((model) => {
    let uri = model.uri.toString();
    if (!uri.startsWith("file:///%21%40") /*!@*/) {
      return;
    }

    // TODO: check language

    model.onDidChangeContent(() => {
      acquireTypes(model.getValue());
    });
    acquireTypes(model.getValue());
  });

  // always import react types, as this library is imported by default in ts.worker
  acquireTypes(`import * as React from "react"`);
}
