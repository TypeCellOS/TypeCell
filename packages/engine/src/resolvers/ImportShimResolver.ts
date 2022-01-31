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

  /**
   * Resolve a moduleName (e.g.: "lodash", "d3") to the actual module
   * using the resolvers passed to the constructor
   */
  public resolveImport = _.memoize(this.doResolveImport);

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

  /**
   * This is called by es-module-shims whenever it wants to resolve an Import.
   */
  private async doResolveImportURL(
    moduleName: string, // can be a relative URL, absolute URL, or "package name"
    parent: string, // the parent URL the package is loaded from
    importShimResolve: any // the original resolve function from es-module-shims
  ): Promise<string> {
    // first try to see if the LocalResolver wants to resolve this module
    const localURL = await this.tryLocalResolver(moduleName);
    if (localURL) {
      // Normally this doesn't happen because the local version
      // would already be resolved in doResolveImport.
      // But if the user imports an ESM URL directly, it can occur,
      // e.g.: import Button from "https://framer.com/m/Button-Nfl9.js@oZJd59CIUVxKzU9MSJos";
      console.warn("local package found directly in doResolveImportURL");
      return localURL;
    }

    // use es-module-shims to find the module url.
    // This basically resolves the URL (parent+moduleName) to an absolute identifier
    // It also takes into account Import Maps, but we don't use those
    const defaultURL = await importShimResolve(moduleName, parent);

    // Try the registered resolvers
    for (let resolver of this.resolvers) {
      if (defaultURL) {
        // Does the URL we're trying to load match with the resolver?
        const parsedModule = await resolver.getModuleInfoFromURL(defaultURL);
        if (parsedModule) {
          // Maybe we're trying to load a nested Package,
          // that we want to override with a package from LocalResolver
          const localURL = await this.tryLocalResolver(
            parsedModule.module,
            parsedModule.mode
          );
          if (localURL) {
            return localURL;
          }

          // hack to use maplibre instead of mapbox for react-map-gl
          if (parsedModule.module === "mapbox-gl") {
            const parsedParent = await resolver.getModuleInfoFromURL(parent);
            if (parsedParent?.module === "react-map-gl") {
              return this.doResolveImportURL(
                "maplibre-gl",
                parent,
                importShimResolve
              );
            }
          }
        }
      } else {
        // moduleName + parent combination couldn't be resolved by es-module-shims
        // (i.e.: it's not an absolute URL, but just a package name like "lodash")
        // Try to get a CDN URL from our resolver
        const resolverURL = await resolver.getURLForModule(moduleName, parent);
        if (resolverURL) {
          return resolverURL;
        }
      }
    }

    return defaultURL;
  }

  private async tryLocalResolver(
    moduleName: string,
    mode?: string
  ): Promise<string | undefined> {
    const local = await this.localResolver.getModule(moduleName, mode);
    if (local) {
      console.log("loading local package", moduleName);
      return this.getLocalURLForModule(local, moduleName, mode);
    }
    return undefined;
  }

  /**
   * Let's say we always want to use the "react" package shipped with TypeCell, so
   * we don't get multiple react packages in the tree (this breaks React).
   *
   * The LocalResolver can return our instance of react for moduleName "react".
   *
   * We then use this function to create a Blob that refers to our react instance.
   *
   * We create a blob so that if we load a library that depends on React from a CDN
   * (e.g.: a react component), we can rewrite the nested dependency to React to use our Blob URL.
   *
   * This function returns the Blob URL, the rewriting is done using es-module-shims and
   * the logic in doResolveImportURL.
   */
  private getLocalURLForModule(
    loadedModule: any,
    moduleName: string,
    mode?: string
  ) {
    const safeName = (moduleName + "/" + mode).replaceAll(
      /[^a-zA-Z0-9_]/g,
      "$"
    );

    if ((window as any)["__typecell_url_" + safeName]) {
      // already loaded
      return (window as any)["__typecell_url_" + safeName];
    }

    (window as any)["__typecell_pkg_" + safeName] = loadedModule;
    const list = Object.keys(loadedModule).filter(
      (key) => key !== "default" && key !== "window"
    );

    const url = createBlob(`
      const ${safeName} = window.__typecell_pkg_${safeName};
      const { ${list.join(",")} } = ${safeName};
      export { ${list.join(",")} };
      export default ${safeName};
    `);
    (window as any)["__typecell_url_" + safeName] = url;
    return url;
  }

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
  }
}
