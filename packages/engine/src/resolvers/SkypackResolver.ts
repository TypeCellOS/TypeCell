import _ from "lodash";

let resolverCreated = false;

function createBlob(source: string) {
  return URL.createObjectURL(
    new Blob([source], { type: "application/javascript" })
  );
}

export class SkypackResolver {
  private importShim: any;

  public constructor(
    private resolveNestedModule?: (moduleName: string) => any
  ) {
    if (resolverCreated) {
      throw new Error(
        "only 1 SkypackResolver can exists because it uses a global importShim"
      );
    }
    resolverCreated = true;
  }

  public async resolveImport(moduleName: string) {
    if (moduleName.startsWith("https://")) {
      // @ts-ignore
      const importShim = await this.getImportShim();
      return { module: importShim(moduleName), dispose: () => {} };
    }

    const importShim = await this.getImportShim();
    return {
      module: importShim(`https://cdn.skypack.dev/${moduleName}`),
      dispose: () => {},
    };
    // return importShim(`https://jspm.dev/${moduleName}`);
  }

  private memoizedResolveNestedModule = _.memoize((moduleName: string) => {
    if (moduleName.startsWith("/-/")) {
      // skypack, e.g.: https://cdn.skypack.dev/-/react-sortable-tree@v2.8.0-nFKv1Y1I3NJ65IUkUWwI/dist=es2020,mode=imports/unoptimized/dist/index.cjs.js
      // TODO: should also pass version identifier (@xx)
      let matches = moduleName.match(/^\/-\/(.+)@/);
      if (!matches || !matches[1]) {
        throw new Error("couldn't match url");
      }
      moduleName = matches[1];
    }

    const module =
      this.resolveNestedModule && this.resolveNestedModule(moduleName);

    if (module) {
      const safeName = moduleName.replaceAll(/[^a-zA-Z0-9_]/g, "$");
      (window as any)["__typecell_" + safeName] = module;
      const list = Object.keys(module).filter((key) => key !== "default");

      const url = createBlob(`
      const ${safeName} = window.__typecell_${safeName};
      const { ${list.join(",")} } = ${safeName};
      export { ${list.join(",")} };
      export default ${safeName};
    `);
      return url;
    }
    return undefined;
  });

  private async getImportShim() {
    if (this.importShim) {
      return this.importShim;
    }
    if (typeof window === "undefined") {
      return undefined;
    }
    await import("es-module-shims");

    // @ts-ignore
    this.importShim = window.importShim as any;

    this.importShim.skip = /none/;
    // const dynamicImport = importShim.dynamicImport;
    // importShim.dynamicImport = async (id: any) => {
    //   const res = await dynamicImport(id);
    //   return res;
    // };

    // @ts-ignore
    const resolve = this.importShim.resolve;
    this.importShim.resolve = (id: string, parent: string) => {
      //   if (moduleName.startsWith("/npm:")) {
      //     // jspm, e.g.: https://ga.jspm.io/npm:es-module-shims@0.10.1/dist/es-module-shims.min.js
      //   } else

      let ret = this.memoizedResolveNestedModule(id);
      if (!ret) {
        ret = resolve(id, parent);
      }
      return ret;
    };

    return this.importShim;
  }
}

/*
https://cdn.skypack.dev/animejs@3.2.0
https://bundle.run/animejs@3.2.0

https://jspm.org/

https://unpkg.com/
jsdelivr https://cdn.jsdelivr.net/npm/react-chrono@1.7.1/dist/react-chrono.umd.js
*/

/*
if (moduleName.startsWith("!@")) {
    const evaluator = getImportEvaluator(
      moduleName,
      cached ? "1" : "" + Math.random()
    ) as ReturnType<typeof createImportEvaluator>;
    // TODO: evaluate is not a nice name if it has already been evaluated
    return evaluator.getModule();
  }*/
