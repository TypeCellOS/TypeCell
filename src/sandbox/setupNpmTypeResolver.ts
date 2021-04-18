import * as monaco from "monaco-editor";
import { detectNewImportsToAcquireTypeFor } from "./typeAcquisition";

const addLibraryToRuntime = (code: string, path: string) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(code, path);
};

export function acquireTypes(model: monaco.editor.ITextModel) {
  detectNewImportsToAcquireTypeFor(
    model.getValue(),
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
    uri = uri.substring("file:///%21%40".length);
    const split = uri.split("/");
    if (split.length !== 3) {
      return;
    }

    model.onDidChangeContent(() => {
      acquireTypes(model);
    });
  });
}
