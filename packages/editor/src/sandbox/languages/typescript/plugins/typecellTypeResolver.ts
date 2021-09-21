import { detectNewImportsToAcquireTypeFor } from "./typeAcquisition";
import type * as monaco from "monaco-editor";
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

  const content = models.map((f) => `export * from "${f}";`).join("\n");
  // register the typings as a node_module.
  // These typings are automatically imported as $ in ts.worker.ts
  monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types${folder.replace("//", "/")}index.d.ts`
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
  // Loads types for standard "typecell" helper library, as defined in typecellEngine/lib/exports
  await loadTypecellLibTypes(
    "typecell",
    "./typecellEngine/lib/exports",
    monacoInstance
  ).catch(console.error);

  // Loads types for "typecell-plugin" helper library, as defined in pluginEngine/lib/exports
  await loadTypecellLibTypes(
    "typecell-plugin",
    "./pluginEngine/lib/exports",
    monacoInstance
  ).catch(console.error);

  addHelperFiles(monacoInstance);

  // Loads types for $ context variables
  listenForTypecellUserModels(monacoInstance);
}
