export class LocalModuleResolver {
  public constructor(
    public readonly getModule: (
      moduleName: string,
      mode?: string
    ) => Promise<any>
  ) {}
  // public abstract getModule(moduleName: string, mode?: string): Promise<any>;
}
