export abstract class ExternalModuleResolver {
  public abstract readonly name: string;

  public abstract getURLForModule(
    moduleName: string,
    parent: string
  ): Promise<undefined | string>;

  public abstract getModuleInfoFromURL(url: string): Promise<
    | {
        module: string;
        mode?: string;
      }
    | undefined
  >;
}
