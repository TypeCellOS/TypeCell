import * as monaco from "monaco-editor";

function refreshTypes(folder: string) {
  // find all typecell scripts in the folder
  const models = monaco.editor
    .getModels()
    .filter((m) => {
      let path = m.uri.path;
      return (
        path.startsWith("/tc/!@" + folder + "/") &&
        (path.endsWith(".tsx") ||
          (path.endsWith(".ts") && !path.endsWith(".d.ts")))
      );
    })
    .map((m) => m.uri.toString().replace(/(\.ts|\.tsx)$/, ""));

  const imports = models
    .map((f, i) => `import type * as f${i} from "${f}";`)
    .join("\n");
  const types = models
    .map((_f, i) => `type t${i} = Omit<typeof f${i}, "default">;`)
    .join("\n");
  const interfaces = models
    .map((_f, i) => `interface IContext extends t${i} {};`)
    .join("\n");

  // TODO: sanitize checks?

  const content = `
${imports}
${types}
    declare module "tc/!@${folder}" {
        interface IContext {}
${interfaces}
/**
 * The context containing the exports of all cells
 */
export const $: IContext;
}`;

  // register the typings as a node_module.
  // These typings are automatically imported as $ in ts.worker.ts
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    content,
    `file:///node_modules/@types/tc/!@${folder}/index.d.ts`
  );
}

export default function setupTypecellTypeResolver() {
  monaco.editor.onDidCreateModel((model) => {
    let uri = model.uri.toString();
    if (!uri.startsWith("file:///tc/%21%40") /*!@*/) {
      return;
    }
    uri = uri.substring("file:///tc/%21%40".length);
    const split = uri.split("/");
    if (split.length !== 3) {
      return;
    }
    const folder = split[0] + "/" + split[1];
    refreshTypes(folder);
    model.onWillDispose(() => {
      refreshTypes(folder);
    });
  });
}
