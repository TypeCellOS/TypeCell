import { ExternalModuleResolver } from "../ExternalModuleResolver.js";

export class ESMshResolver extends ExternalModuleResolver {
  public readonly name = "esm.sh";

  public async getModuleInfoFromURL(url: string) {
    // https://cdn.esm.sh/v66/@tldraw/core@1.7.0/es2021/core.js

    const prefix = "https://esm.sh/";
    if (url.startsWith(prefix)) {
      url = url.substring(prefix.length - 1);
      let mode: string | undefined;
      let library = url.match(/^\/(v\d+|stable)\/[^\/]+\.js$/);

      if (library) {
        return undefined;
      }
      let matches = url.match(
        /^\/(v\d+|stable)\/(.*)@[.\d]+(-[-a-z\d.]+)?\/(.*)$/
      );
      if (!matches || !matches[2]) {
        throw new Error("couldn't match url");
      }
      const matchedModuleName = matches[2];

      // mode is necessary for jsx-runtime, e.g.: @yousef/use-p2
      mode = matches[4];

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
    return `https://esm.sh/${moduleName}`;
  }
}
