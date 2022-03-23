import { ExternalModuleResolver } from "../ExternalModuleResolver";

export class SkypackResolver extends ExternalModuleResolver {
  public readonly name = "skypack";

  public async getModuleInfoFromURL(url: string) {
    // skypack, e.g.: https://cdn.skypack.dev/-/react-sortable-tree@v2.8.0-nFKv1Y1I3NJ65IUkUWwI/dist=es2020,mode=imports/unoptimized/dist/index.cjs.js
    // TODO: should also pass version identifier (@xx)

    const prefix = "https://cdn.skypack.dev/";
    if (url.startsWith(prefix)) {
      url = url.substring(prefix.length - 1);
      let mode: string | undefined;
      let matches = url.match(/^\/(new|-)\/(.+)@v[\d.]+[-\/].*mode=(.*)$/);
      if (!matches || !matches[2]) {
        throw new Error("couldn't match url");
      }
      const matchedModuleName = matches[2];

      // mode is necessary for jsx-runtime, e.g.: @yousef/use-p2
      mode = matches[3];

      return {
        module: matchedModuleName,
        mode,
      };
    }
    return undefined;
  }

  public async getURLForModule(moduleName: string, parent: string) {
    if (moduleName.startsWith("https://") || moduleName.startsWith("../")) {
      throw new Error("unexpected modulename");
    }
    return `https://cdn.skypack.dev/${moduleName}`;
  }
}
