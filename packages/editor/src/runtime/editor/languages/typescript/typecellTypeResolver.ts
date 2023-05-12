import type * as monaco from "monaco-editor";
import { parseIdentifier } from "../../../../identifiers";
import { detectNewImportsToAcquireTypeFor } from "./typeAcquisition";
/**
 * Uses type definitions emitted by npm run emittypes to the public/types directory.
 * Now we can use types from this typecell codebase in the runtime
 *
 * TODO: if loading multiple modules, we won't reuse underlying types and they will be reloaded from public/types,
 * might not be ideal architecture but probably also doesn't have a large impact
 */
async function loadTypecellLibTypes(
  moduleName: string,
  typecellTypePath: string,
  monacoInstance: typeof monaco
) {
  const lib = `
    import getExposeGlobalVariables from "${typecellTypePath}";
    let exp: ReturnType<typeof getExposeGlobalVariables>;
    export default exp;
  `;

  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    lib,
    `file:///node_modules/@types/${moduleName}/index.d.ts`
  );

  await detectNewImportsToAcquireTypeFor(
    lib,
    monacoInstance.languages.typescript.typescriptDefaults.addExtraLib.bind(
      monacoInstance.languages.typescript.typescriptDefaults
    ),
    window.fetch.bind(window),
    console, // TODO
    moduleName
  );
}

function refreshUserModelTypes(folder: string, monacoInstance: typeof monaco) {
  // find all typecell scripts in the folder
  const models = monacoInstance.editor
    .getModels()
    .filter((m) => {
      let path = m.uri.path;
      return (
        path.startsWith(folder) &&
        (path.endsWith(".tsx") ||
          (path.endsWith(".ts") && !path.endsWith(".d.ts")))
      );
    })
    .map((m) => m.uri.toString().replace(/(\.ts|\.tsx)$/, ""));

  if (!folder.startsWith("/!@") && !folder.endsWith("/")) {
    throw new Error("expected folder to start with / and end with /");
  }

  let content = models.map((f) => `export * from "${f}";`).join("\n");

  // TODO: we register two libs. Would be nicer to detect the main notebook from imported libs and register them appropriately

  // for main notebook
  // register the typings as a node_module in the full folder name (e.g.: !@mx://mx.typecell.org/@abc/abcccc)
  // These typings are automatically imported as $ in ts.worker.ts
  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types${folder.replace("//", "/")}index.d.ts`
  );

  // TODO: this is hacky, we should not have a dependency on Identifier here
  const identifierStr = folder.substring("/!@".length, folder.length - 1);
  const identifier = parseIdentifier(identifierStr); // TODO
  let packageName = identifier.toString();
  if (packageName.startsWith("/")) {
    throw new Error("expected packageName to not start with /");
  }
  packageName = "!" + packageName;

  // for imported libs
  // register the typings as a node_module in the short identifier name (e.g.: !@abc/abcccc)
  // These is required when we import a different typecell module using the shorthand (import "!@abc/abcccc")
  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/${packageName}/index.d.ts`
  );
}

/**
 * This adds OnlyViews and Values to use in ts.worker.ts
 */
function addHelperFiles(monacoInstance: typeof monaco) {
  const content = `
import type * as React from "react";

type ReactView<T> = React.ReactElement<{__tcObservable: T}>;

export type OnlyViews<T> = {
  // [E in keyof T as T[E] extends ReactView<any> ? E : never]: T[E];
  [E in keyof T]: T[E] extends ReactView<any> ? T[E] : never;
};

export type Values<T> = {
  [E in keyof T]: T[E] extends ReactView<infer B> ? B : T[E];
};
`;
  // register the typings as a node_module.
  // These typings are automatically imported as $ in ts.worker.ts
  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/typecell-helpers/index.d.ts`
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
    if (!model.uri.path.startsWith("/!@")) {
      return;
    }

    model.onDidChangeContent((e) => {});
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
export default async function setupTypecellTypeResolver(
  monacoInstance: typeof monaco
) {
  // Loads types for "typecell-plugin" helper library, as defined in pluginEngine/lib/exports
  // await loadTypecellLibTypes(
  //   "typecell-plugin",
  //   "./pluginEngine/lib/exports",
  //   monacoInstance
  // ).catch(console.error);

  addHelperFiles(monacoInstance);

  // Loads types for $ context variables
  listenForTypecellUserModels(monacoInstance);

  // Loads types for standard "typecell" helper library, as defined in typecellEngine/lib/exports
  await loadTypecellLibTypes(
    "typecell",
    "./runtime/executor/lib/exports",
    monacoInstance
  ).catch(console.error);
}
