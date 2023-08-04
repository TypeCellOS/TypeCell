import { CodeModel } from "@typecell-org/engine";
import SourceModelCompiler from "../../compiler/SourceModelCompiler";
import { NPMLibraryResolver } from "./NPMResolver";
import { TypeCellHelperLibraryResolver } from "./TypeCellHelperLibraryResolver";
import { TypeCellModuleResolver } from "./TypeCellModuleResolver";

/**
 * The resolver is responsible for resolving imports from user code.
 *
 * This resolver supports the following:
 *
 * 1. TypeCell library imports
 *
 *  import * as typecell from "typecell";
 *
 * This resolves to the object from ../lib/exports
 *
 * 2. TypeCell Notebook imports
 *
 *  import * as nb from "!username/notebook"
 *
 * This loads a notebook from TypeCell + compiles and executes it whenever it changes
 *
 * 3. NPM imports
 *
 *  import * as _ from "lodash";
 *
 * This uses the `importShimResolver` to resolve the module via Skypack
 * (with some exceptions that are loaded locally via LocalResolver)
 *
 */
export class Resolver<T extends CodeModel> {
  private readonly typecellResolver: TypeCellModuleResolver<T>;

  constructor(
    typeCellModuleCompilerFactory: (
      moduleName: string
    ) => Promise<SourceModelCompiler>
  ) {
    this.typecellResolver = new TypeCellModuleResolver(
      typeCellModuleCompilerFactory,
      // use this resolver to resolve nested imports
      (moduleName: string, forModelList: T[]) =>
        this.resolveImportList(moduleName, forModelList)
    );
  }

  public resolveImportList = async (moduleName: string, forModelList: T[]) => {
    const resolvers = [
      TypeCellHelperLibraryResolver,
      this.typecellResolver.resolveImport,
      NPMLibraryResolver,
    ];
    // try above resolvers one-by-one
    for (const resolver of resolvers) {
      const ret = await resolver(moduleName, forModelList);
      if (ret) {
        return ret;
      }
    }
    throw new Error(`Could not resolve import ${moduleName}`);
  };

  public resolveImport = async (moduleName: string, forModel: T) => {
    return this.resolveImportList(moduleName, [forModel]);
  };
}
