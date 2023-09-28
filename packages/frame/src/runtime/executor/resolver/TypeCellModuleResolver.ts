import {
  ReactiveEngine,
  ResolvedImport,
  RunContext,
} from "@typecell-org/engine";
import { CodeModel, ModelProvider } from "@typecell-org/shared";
import { EditorStore } from "../../../EditorStore";

export class TypeCellModuleResolver<T extends CodeModel> {
  private readonly cache = new Map<string, ResolvedImport>();
  constructor(
    private readonly createTypeCellCompiledCodeProvider: (
      moduleName: string,
    ) => Promise<ModelProvider>,
    private readonly resolverForNestedModules: (
      moduleName: string,
      forModelList: T[],
      runContext: RunContext,
      editorStore: EditorStore,
    ) => Promise<ResolvedImport | undefined>,
  ) {}

  public resolveImport = async (
    moduleName: string,
    forModelList: T[],
    runContext: RunContext,
    editorStore: EditorStore,
  ) => {
    if (!moduleName.startsWith("!")) {
      // It's not a typecell module that's being imported
      return undefined;
    }
    // when a notebook is imported in a cell, we need to create a reactive engine running the imported notebook
    // this reactive engine should be unique per cell, so we use the cell path "hierarchy" as a key
    const key = [...forModelList.map((m) => m.path), moduleName].join("$$");

    const cached = this.cache.get(key);
    debugger;
    if (cached) {
      return cached;
    }
    const provider = await this.createTypeCellCompiledCodeProvider(moduleName);
    const engine = new ReactiveEngine<T>((moduleName, forModel, runContext) =>
      this.resolverForNestedModules(
        moduleName,
        [...forModelList, forModel],
        runContext,
        editorStore,
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    engine.registerModelProvider(provider as any); // TODO

    let disposed = false;
    console.log("LOADED MODULE");
    const ret = {
      module: engine.observableContext.context,
      dispose: () => {
        console.log("DISPOSE MODULE");
        if (disposed) {
          throw new Error("already disposed");
        }
        this.cache.delete(key);
        disposed = true;
        engine.dispose();
        provider.dispose();
      },
    };
    this.cache.set(key, ret);
    return ret;
  };
}
