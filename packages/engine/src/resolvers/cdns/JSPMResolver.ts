import { ExternalModuleResolver } from "../ExternalModuleResolver.js";

export class JSPMResolver extends ExternalModuleResolver {
  public readonly name = "jspm";

  public async getModuleInfoFromURL(url: string) {
    // TODO: should also pass version identifier (@xx)

    const prefix = "https://jspm.dev/";
    if (url.startsWith(prefix)) {
      url = url.substring(prefix.length - 1);
      let mode: string | undefined;
      let matches = url.match(/^\/npm:(.*)$/);
      if (!matches || !matches[1]) {
        throw new Error("couldn't match url");
      }
      const matchedModuleName = matches[1];

      // mode is necessary for jsx-runtime, e.g.: @yousef/use-p2
      mode = undefined; //matches[3];

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
    return `https://jspm.dev/npm:${moduleName}`;
  }
}
