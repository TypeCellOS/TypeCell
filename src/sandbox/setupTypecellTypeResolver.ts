import * as monaco from "monaco-editor";
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
  typecellTypePath: string
) {
  const lib = `
    import getExposeGlobalVariables from "${typecellTypePath}";
    let exp: ReturnType<typeof getExposeGlobalVariables>;
    export default exp;
  `;

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    lib,
    `file:///node_modules/@types/${moduleName}/index.d.ts`
  );

  detectNewImportsToAcquireTypeFor(
    lib,
    monaco.languages.typescript.typescriptDefaults.addExtraLib.bind(
      monaco.languages.typescript.typescriptDefaults
    ),
    window.fetch.bind(window),
    console, // TODO
    moduleName
  );
}

function refreshUserModelTypes(folder: string) {
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

  const content = models.map((f) => `export * from "${f}";`).join("\n");

  // register the typings as a node_module.
  // These typings are automatically imported as $ in ts.worker.ts
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/!@${folder}/index.d.ts`
  );
}

/**
 * This exposes the types of the context to the monaco runtime
 */
function listenForTypecellUserModels() {
  monaco.editor.onDidCreateModel((model) => {
    // console.log("created", model.uri.toString());
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
    refreshUserModelTypes(folder);
    model.onWillDispose(() => {
      // console.log("dispose", model.uri.toString());
      refreshUserModelTypes(folder);
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
export default function setupTypecellTypeResolver() {
  // Loads types for standard "typecell" helper library, as defined in typecellEngine/lib/exports
  loadTypecellLibTypes("typecell", "./typecellEngine/lib/exports");

  // Loads types for "typecell-plugin" helper library, as defined in pluginEngine/lib/exports
  loadTypecellLibTypes("typecell-plugin", "./pluginEngine/lib/exports");

  // Loads types for $ context variables
  listenForTypecellUserModels();
}
