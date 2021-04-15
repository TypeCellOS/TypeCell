import * as monaco from "monaco-editor";

function refreshTypes(folder: string) {
  // find all typecell scripts in the folder
  const models = monaco.editor
    .getModels()
    .filter((m) => {
      let path = m.uri.path;
      return (
        path.startsWith("/!@" + folder + "/") &&
        (path.endsWith(".tsx") ||
          (path.endsWith(".ts") && !path.endsWith(".d.ts")))
      );
    })
    .map((m) => m.uri.toString().replace(/(\.ts|\.tsx)$/, ""));

  const content = models.map((f, i) => `export * from "${f}";`).join("\n");

  // register the typings as a node_module.
  // These typings are automatically imported as $ in ts.worker.ts
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/!@${folder}/index.d.ts`
  );
}

export default function setupTypecellTypeResolver() {
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

    model.onDidChangeContent((e) => {});

    const folder = split[0] + "/" + split[1];
    refreshTypes(folder);
    model.onWillDispose(() => {
      refreshTypes(folder);
    });
  });
}
