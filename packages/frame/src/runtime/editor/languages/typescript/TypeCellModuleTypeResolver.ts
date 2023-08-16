import type * as monaco from "monaco-editor";

function refreshUserModelTypes(folder: string, monacoInstance: typeof monaco) {
  // find all typecell scripts in the folder
  const models = monacoInstance.editor
    .getModels()
    .filter((m) => {
      const path = m.uri.path;
      return (
        path.startsWith(folder) &&
        (path.endsWith(".tsx") ||
          (path.endsWith(".ts") && !path.endsWith(".d.ts")))
      );
    })
    .map((m) => m.uri.toString().replace(/(\.ts|\.tsx)$/, ""));

  if (!folder.startsWith("/!") && !folder.endsWith("/")) {
    throw new Error("expected folder to start with / and end with /");
  }

  const folderName = folder.substring("/".length, folder.length - 1); // !typecell:typecell.org/dALYTUW8TXxsw

  const content = models.map((f) => `export * from "${f}";`).join("\n");

  // register the typings as a node_module in the full folder name (e.g.: !typecell:typecell.org/dALYTUW8TXxsw)
  // These typings are automatically imported as $ in ts.worker.ts
  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/${folderName}/index.d.ts`
  );
}

/**
 * This exposes the types of the context to the monaco runtime
 */
function listenForTypecellUserModels(monacoInstance: typeof monaco) {
  if (monacoInstance.editor.getModels().length > 0) {
    // Note / improve: only listens for new models, doesn't inspect already
    // registered models. For now ok as it's called on startup (before models are added)
    console.error(
      "unexpected, listenForTypecellUserModels should be called before models are registered"
    );
  }
  monacoInstance.editor.onDidCreateModel((model) => {
    if (!model.uri.path.startsWith("/!")) {
      return;
    }

    // model.onDidChangeContent((e) => {});
    const folder = model.uri.path.substring(
      0,
      model.uri.path.lastIndexOf("/") + 1
    );

    refreshUserModelTypes(folder, monacoInstance);
    model.onWillDispose(() => {
      // console.log("dispose", model.uri.toString());
      refreshUserModelTypes(folder, monacoInstance);
    });
  });
}

/**
 * Registers the types for:
 * - user written code and the $ context variable
 * - built in helper library
 *
 * These types are automatically imported in the cell / plugin context, in ts.worker.ts
 */
export async function setupTypecellModuleTypeResolver(
  monacoInstance: typeof monaco
) {
  // Loads types for $ context variables
  listenForTypecellUserModels(monacoInstance);
}
