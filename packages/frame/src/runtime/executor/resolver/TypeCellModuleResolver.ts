import { ReactiveEngine, ResolvedImport } from "@typecell-org/engine";
import { CodeModel, ModelProvider } from "@typecell-org/shared";

export class TypeCellModuleResolver<T extends CodeModel> {
  private readonly cache = new Map<string, ResolvedImport>();
  constructor(
    private readonly createTypeCellCompiledCodeProvider: (
      moduleName: string
    ) => Promise<ModelProvider>,
    private readonly resolverForNestedModules: (
      moduleName: string,
      forModelList: T[]
    ) => Promise<ResolvedImport | undefined>
  ) {}

  public resolveImport = async (moduleName: string, forModelList: T[]) => {
    if (!moduleName.startsWith("!")) {
      // It's not a typecell module that's being imported
      return undefined;
    }
    // when a notebook is imported in a cell, we need to create a reactive engine running the imported notebook
    // this reactive engine should be unique per cell, so we use the cell path "hierarchy" as a key
    const key = [...forModelList.map((m) => m.path), moduleName].join("$$");

    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const provider = await this.createTypeCellCompiledCodeProvider(moduleName);
    const engine = new ReactiveEngine<T>((moduleName, forModel) =>
      this.resolverForNestedModules(moduleName, [...forModelList, forModel])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    engine.registerModelProvider(provider as any); // TODO

    let disposed = false;
    const ret = {
      module: engine.observableContext.context,
      dispose: () => {
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
