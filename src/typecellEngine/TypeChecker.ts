import * as monaco from "monaco-editor";
import { getCompiledCode } from "../engine/compilers/monacoHelpers";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { TypeVisualizer } from "./lib/exports";

// TODO: add as local file instead of declare module?
// monaco.languages.typescript.typescriptDefaults.addExtraLib(
//   "declare module 'ts-transformer-enumerate' { export function enumerate<T extends string>(): { [K in T]: K }; }",
//   "transformers/ts-transformer-enumerate.d.ts"
// );

export class TypeChecker {
  private readonly model: monaco.editor.ITextModel;
  constructor(private readonly documentId: string) {
    const uri = monaco.Uri.file(
      // `/typecell/typechecker/${documentId}/typechecker.ts`
      `/typechecker.ts`
    );

    this.model = monaco.editor.getModel(uri)!;
    if (!this.model) {
      this.model = monaco.editor.createModel("", "typescript", uri);
    }
  }

  public async findMatchingVisualizers(
    module: TypeCellCodeModel,
    visualizers: Map<string, TypeVisualizer<any>>
  ) {
    let keys = Array.from(visualizers.entries());

    let imports = keys
      .map((key) => `import { ${key[0]} } from "!${this.documentId}";`)
      .join("\n");

    let plugins = keys
      .map((key) => `${key[0]}: ${key[0]}.visualizer.function`)
      .join(",\n");

    const otherUri = monaco.Uri.file(
      module.path
      // `/!${this.documentId}/0.2912850723158924.cell`
    );
    const uristring = otherUri.toString().replace(/(\.ts|\.tsx)$/, "");
    const code = `
    ${imports}

    type arg0Type<T> = T extends (arg0: infer R, ...args: any[]) => void ? R : any;
  
                type truePropertyNames<T> = {
                  [K in keyof T]: T[K] extends never ? never : K;
                }[keyof T];
  
                export type matchingPlugins<PluginsType, ObjectType> = any extends ObjectType
                  ? never
                  : truePropertyNames<{ [K in keyof PluginsType]: ObjectType extends arg0Type<PluginsType[K]> ? true : never }>;
  
  
                type RequireOnlyOne<T> = {
                  [K in keyof T]: { type: T[K]; exclude: Exclude<keyof T, K> };
                } extends {
                  [K in keyof T]: { type: infer R; exclude: never };
                }
                  ? R
                  : never;
                
                  // mainExportType.d.tsx
                export type mainExportType<T> = T extends {
                  default: infer R;
                }
                  ? R
                  : RequireOnlyOne<T> extends never
                  ? T
                  : RequireOnlyOne<T>;
                  

                  export let plugins = {
                    ${plugins}
                  };


                  import * as mod from "${uristring}";

                 
                  // import { enumerate } from "ts-transformer-enumerate";
                  // export { mod };
                  type mainExportTypeModule = mainExportType<typeof mod>;
                  type pluginsPossible = matchingPlugins<typeof plugins, mainExportTypeModule>;
                  
                  // export default Object.keys(enumerate<pluginsPossible>()));

                  // let x: pluginsPossible = {} as any;

                  let filteredPlugins: Pick<typeof plugins, pluginsPossible> = {} as any;
                  filteredPlugins.`;

    this.model.setValue(code);

    let mainWorker = await monaco.languages.typescript.getTypeScriptWorker();

    // this.model.getWordAtPosition(code.length - 1);
    let x = await mainWorker(this.model.uri);
    const completions = await x.getCompletionsAtPosition(
      this.model.uri.toString(),
      this.model.getValue().length
    );

    if (
      !completions ||
      !completions.isMemberCompletion ||
      completions.isGlobalCompletion
    ) {
      return [];
    }

    const pluginNames = completions.entries.map(
      (entry: any) => entry.name
    ) as string[];
    // TODO: sanity check

    return pluginNames;
  }
}
