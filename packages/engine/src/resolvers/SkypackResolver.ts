import { ExternalModuleResolver } from "./ExternalModuleResolver";

export class SkypackResolver extends ExternalModuleResolver {
  public async getModuleInformation(
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
  > {
    let mode: string | undefined;
    if (
      moduleName.startsWith("/-/") &&
      parent.startsWith("https://cdn.skypack.dev/")
    ) {
      // skypack, e.g.: https://cdn.skypack.dev/-/react-sortable-tree@v2.8.0-nFKv1Y1I3NJ65IUkUWwI/dist=es2020,mode=imports/unoptimized/dist/index.cjs.js
      // TODO: should also pass version identifier (@xx)
      let matches = moduleName.match(/^\/-\/(.+)@v[\d.]+-.*mode=(.*)$/);
      if (!matches || !matches[1]) {
        throw new Error("couldn't match url");
      }
      const matchedModuleName = matches[1];

      // mode is necessary for jsx-runtime, e.g.: @yousef/use-p2
      mode = matches[2];

      return {
        type: "module",
        module: matchedModuleName,
        mode,
      };
    }
    if (moduleName.startsWith("https://")) {
      return undefined;
    }
    return { type: "url", url: `https://cdn.skypack.dev/${moduleName}` };
  }
}
