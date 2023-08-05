import { CodeModel } from "@typecell-org/shared";
import type * as monaco from "monaco-editor";
import { async, lifecycle } from "vscode-lib";

type WorkerType = (
  ...uris: monaco.Uri[]
) => Promise<monaco.languages.typescript.TypeScriptWorker | undefined>;

export class TypeChecker extends lifecycle.Disposable {
  private worker: WorkerType | undefined;
  private readonly model: monaco.editor.ITextModel;
  private queue = new async.Sequencer();

  constructor(
    private readonly documentId: string,
    private readonly monacoInstance: typeof monaco
  ) {
    super();
    const uri = monacoInstance.Uri.file(
      `/typecell/typechecker/${documentId}/typechecker.ts`
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.model = monacoInstance.editor.getModel(uri)!;

    if (this.model) {
      //throw new Error("unexpected, TypeChecker model already exists");
      return;
    }

    this.model = this._register(
      monacoInstance.editor.createModel("", "typescript", uri)
    );
  }

  public findMatchingVisualizers(module: CodeModel) {
    return this.queue.queue(() => this._findMatchingVisualizers(module));
  }

  private async _findMatchingVisualizers(module: CodeModel) {
    const otherUri = this.monacoInstance.Uri.file(module.path);
    const uristring = otherUri.toString().replace(/(\.ts|\.tsx)$/, "");
    // console.log(uristring, this.documentId.replace("//", "/"));
    const code = `

    import * as doc from "!${this.documentId.replace("//", "/")}";
    import * as mod from "${uristring}";
    import tc from "typecell";
    import { TypeVisualizer } from "typecell/runtime/executor/lib/exports";
    // type TypeVisualizer<T> = typeof tc["TypeVisualizer"];

    type truePropertyNames<T> = {
      [K in keyof T]: T[K] extends never ? never : K;
    }[keyof T];
    
    type matchingPlugins<PluginsType, ObjectType> = any extends ObjectType
      ? never
      : truePropertyNames<{
          [K in keyof PluginsType]: ObjectType extends PluginsType[K] //arg0Type<PluginsType[K]>
            ? true
            : never;
        }>;
    
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
    
    //   type pluginTypes<T> = { [K in keyof T]: T[K] extends InstanceType<typeof tc["TypeVisualizer"]> ? T[K]["visualizer"]["function"] : never };
    type pluginTypes<T> = {
      [K in keyof T]: T[K] extends TypeVisualizer<infer R>
        ? unknown extends R // filter out "any" types
          ? never
          : R
        : never;
    };
    type docPluginTypes = pluginTypes<typeof doc>;
    
    type mainExportTypeModule = mainExportType<typeof mod>;
    type pluginsPossible = matchingPlugins<docPluginTypes, mainExportTypeModule>;
    
    let filteredPlugins: Pick<docPluginTypes, pluginsPossible> = {} as any;
    filteredPlugins.`;

    this.model.setValue(code);

    if (!this.worker) {
      this.worker =
        await this.monacoInstance.languages.typescript.getTypeScriptWorker();
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ts = (await this.worker(this.model.uri))!;

    // Uncomment for debugging / error checking purposes
    // (await ts.getSyntacticDiagnostics(this.model.uri.toString())).forEach(
    //   (d) => {
    //     console.log("syn", d.messageText);
    //   }
    // );

    // (await ts.getSemanticDiagnostics(this.model.uri.toString())).forEach(
    //   (d) => {
    //     console.log("sem", d.messageText);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entry: any) => entry.name
    ) as string[];

    // TODO: sanity check, does entry occur in visualizers

    return pluginNames;
  }
}
