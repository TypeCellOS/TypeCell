export abstract class ExternalModuleResolver {
  public abstract getModuleInformation(
    moduleName: string,
    parent: string
  ): Promise<
    | {
        type: "url";
        url: string;
      }
    | {
        type: "module";
        module: string;
        mode?: string;
      }
    | undefined
  >;
}
