import * as monaco from "monaco-editor";
import { CodeModel } from "../engine/CodeModel";
import { TypeCellCodeModel } from "../models/TypeCellCodeModel";
import { Sequencer } from "../util/vscode-common/async";
import { Disposable } from "../util/vscode-common/lifecycle";
import { TypeVisualizer } from "./lib/exports";

type WorkerType = (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

export class TypeChecker extends Disposable {
  private worker: WorkerType | undefined;
  private readonly model: monaco.editor.ITextModel;
  private queue = new Sequencer();

  constructor(
    private readonly engineId: string,
    private readonly documentId: string
  ) {
    super();
    const uri = monaco.Uri.file(
      `/typecell/typechecker/${documentId}/typechecker${engineId}.ts`
    );

    this.model = monaco.editor.getModel(uri)!;

    if (this.model) {
      throw new Error("unexpected, TypeChecker model already exists");
    }

    this.model = this._register(
      monaco.editor.createModel("", "typescript", uri)
    );
  }

  public findMatchingVisualizers(
    module: CodeModel,
    visualizers: Map<string, TypeVisualizer<any>>
  ) {
    if (visualizers.size === 0) {
      return [] as string[];
    }
    let visualizerEntries = Array.from(visualizers.entries());

    return this.queue.queue(() =>
      this._findMatchingVisualizers(module, visualizerEntries)
    );
  }

  private async _findMatchingVisualizers(
    module: CodeModel,
    visualizerKeys: Array<[string, TypeVisualizer<any>]>
  ) {
    let imports = visualizerKeys
      .map((key) => `import { ${key[0]} } from "!${this.documentId}";`)
      .join("\n");

    let plugins = visualizerKeys
      .map((key) => `${key[0]}: ${key[0]}.visualizer.function`)
      .join(",\n");

    const otherUri = monaco.Uri.file(module.path);
    const uristring = otherUri.toString().replace(/(\.ts|\.tsx)$/, "");
    const code = `
    ${imports}

    import * as mod from "${uristring}";

    type arg0Type<T> = T extends (arg0: infer R, ...args: any[]) => void ? R : any;
  
    type truePropertyNames<T> = {
      [K in keyof T]: T[K] extends never ? never : K;
    }[keyof T];

    type matchingPlugins<PluginsType, ObjectType> = any extends ObjectType
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
    type mainExportType<T> = T extends {
      default: infer R;
    }
      ? R
      : RequireOnlyOne<T> extends never
      ? T
      : RequireOnlyOne<T>;
      
      let plugins = {
        ${plugins}
      };

      type mainExportTypeModule = mainExportType<typeof mod>;
      type pluginsPossible = matchingPlugins<typeof plugins, mainExportTypeModule>;

      let filteredPlugins: Pick<typeof plugins, pluginsPossible> = {} as any;
      filteredPlugins.`;

    this.model.setValue(code);

    if (!this.worker) {
      this.worker = await monaco.languages.typescript.getTypeScriptWorker();
    }

    let ts = (await this.worker(this.model.uri))!;

    // (await ts.getSyntacticDiagnostics(this.model.uri.toString())).forEach(
    //   (d) => {
    //     console.log(d.messageText);
    //   }
    // );

    const completions = await ts.getCompletionsAtPosition(
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

    // TODO: sanity check, does entry occur in visualizers

    return pluginNames;
  }
}
