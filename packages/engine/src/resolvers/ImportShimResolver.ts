import _ from "lodash";
import { ExternalModuleResolver } from "./ExternalModuleResolver";
import { LocalModuleResolver } from "./LocalModuleResolver";

let importShimCreated = false;

function createBlob(source: string) {
  return URL.createObjectURL(
    new Blob([source], { type: "application/javascript" })
  );
}

export class ImportShimResolver {
  private importShim: any;
  // private importShimOriginalResolve: any;

  public constructor(
    private readonly resolvers: ExternalModuleResolver[],
    private readonly localResolver: LocalModuleResolver
  ) {
    if (importShimCreated) {
      throw new Error(
        "only 1 ImportShimResolver can exists because it uses a global importShim"
      );
    }
    importShimCreated = true;
  }

  private async doResolveImport(moduleName: string) {
    await this.initializeImportShim();
    const local = await this.localResolver.getModule(moduleName);

    if (local) {
      return {
        module: local,
        dispose: () => {},
      };
    }
    return {
      module: await this.importShim(moduleName),
      dispose: () => {},
    };
  }

  private async doResolveImportURL(
    moduleName: string,
    parent: string,
    importShimResolve: any
  ) {
    for (let resolver of this.resolvers) {
      const result = await resolver.getModuleInformation(moduleName, parent);
      if (result) {
        if (result.type === "module") {
          const local = await this.localResolver.getModule(
            result.module,
            result.mode
          );
          if (local) {
            return this.getLocalURLForModule(local, result.module, result.mode);
          } else {
            // continue with original url
            return importShimResolve(moduleName, parent);
          }
        }
        return result.url; //this.importShimOriginalResolve(result.url);
      }
    }

    if (moduleName.startsWith("https://")) {
      return moduleName;
    }
    //return undefined;
    throw new Error("can't resolve " + moduleName);
  }

  private getLocalURLForModule(
    loadedModule: any,
    moduleName: string,
    mode?: string
  ) {
    const safeName = (moduleName + "/" + mode).replaceAll(
      /[^a-zA-Z0-9_]/g,
      "$"
    );
    (window as any)["__typecell_" + safeName] = loadedModule;
    const list = Object.keys(loadedModule).filter(
      (key) => key !== "default" && key !== "window"
    );

    const url = createBlob(`
      const ${safeName} = window.__typecell_${safeName};
      const { ${list.join(",")} } = ${safeName};
      export { ${list.join(",")} };
      export default ${safeName};
    `);
    return url;
  }
  public resolveImport = _.memoize(this.doResolveImport);

  private onImportShimResolve = async (
    id: string,
    parent: string,
    importShimResolve: any
  ) => {
    const ret = await this.doResolveImportURL(id, parent, importShimResolve);
    return ret;
  };

  private async initializeImportShim() {
    if (this.importShim) {
      return this.importShim;
    }
    if (typeof window === "undefined") {
      return undefined;
    }

    (window as any).esmsInitOptions = {
      skip: /none/,
      resolve: this.onImportShimResolve,
      shimMode: true,
    };

    await import("es-module-shims");
    this.importShim = window.importShim as any;

    // this.importShim.skip = /none/;
    // const dynamicImport = importShim.dynamicImport;
    // importShim.dynamicImport = async (id: any) => {
    //   const res = await dynamicImport(id);
    //   return res;
    // };

    // this.importShimOriginalResolve = this.importShim.resolve;
    // this.importShim.resolve = this.onImportShimResolve;
    // this.importShim.resolve = (id: string, parent: string) => {
    //   //   if (moduleName.startsWith("/npm:")) {
    //   //     // jspm, e.g.: https://ga.jspm.io/npm:es-module-shims@0.10.1/dist/es-module-shims.min.js
    //   //   } else
    //   debugger;
    //   let ret = this.memoizedResolveNestedModule(id);
    //   if (!ret) {
    //     if (
    //       parent.startsWith("https://cdn.skypack.dev/-/react-map-gl") &&
    //       id.startsWith("/-/mapbox-gl@")
    //     ) {
    //       ret = resolve("https://cdn.skypack.dev/maplibre-gl", parent);
    //     } else {
    //       ret = resolve(id, parent);
    //     }
    //   }
    //   return ret;
    // };
  }
}
