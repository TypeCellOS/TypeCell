import * as tsvfs from "@typescript/vfs";
import lzstring from "lz-string";
import * as ts from "typescript";
import { getDefaultSandboxCompilerOptions } from "../sandbox/compilerOptions";

type moduleData = {
  jsCode: string;
  dtsCode: string;
};

// TODO: do we want a global cache?
const moduleCache = new Map<string, moduleData>();

export async function importTypeCell(owner: string, slug: string) {
  const moduleName = `!@${owner}/${slug}`;
  if (moduleCache.has(moduleName)) {
    return moduleCache.get(moduleName)!;
  }

  let compilerOptions = getDefaultSandboxCompilerOptions(
    { useJavaScript: false },
    ts as any /* TODO */
  );
  compilerOptions.module = ts.ModuleKind.AMD as any; // TODO;
  compilerOptions.esModuleInterop = false;
  compilerOptions.target = ts.ScriptTarget.ES2017;
  compilerOptions.outFile = "build.js";
  compilerOptions.declaration = true;
  compilerOptions.jsx = ts.JsxEmit.React;

  const fsMap = await tsvfs.createDefaultMapFromCDN(
    compilerOptions,
    ts.version,
    true,
    ts,
    lzstring
  );

  /*
  const rootMst = RootMST.create(JSON.parse(doc.data()!.notebookData));
  const cells: CellModel[] = rootMst.rootCell
    .getDescendantCells()
    .filter((c) => c.language === "typescript");
    
  cells.forEach((c) =>
    fsMap.set("/" + moduleName + "/" + c.path, c.code + "\n export {};")
  ); // add export {} so that all files are treated as modules));
  fsMap.set("/" + moduleName + "/global.d.ts", rootMst.globalCode);
  fsMap.set("/" + moduleName + "/index.ts", rootMst.getLibCode(moduleName));

  const system = tsvfs.createSystem(fsMap);

  const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, ts);
  const program = ts.createProgram({
    rootNames: [...(fsMap.keys() as any)],
    options: compilerOptions,
    host: host.compilerHost,
  });
  program.emit();
  let jsCode = system.readFile("build.js")!;
  let dtsCode = system.readFile("build.d.ts")!;

  // we need index module in dtsCode, but not in jsCode
  jsCode = jsCode.replace(/^define\("index",.*}\);/ms, "");

  // TODO: better type export in TS 4.1: https://devblogs.microsoft.com/typescript/announcing-typescript-4-1-beta/
  dtsCode = dtsCode.replaceAll(
    `declare module "`,
    `declare module "${moduleName}/`
  );
  dtsCode = dtsCode.replaceAll(
    `declare module "${moduleName}/index" {`,
    `declare module "${moduleName}" {`
  );

  // log diagnostics
  // for (const dd of program.getSemanticDiagnostics()) {
  //   console.log(dd);
  // }

  // TODO: check for errors?

  const ret = {
    jsCode,
    dtsCode,
  };
  moduleCache.set(moduleName, ret);
  return ret;*/
  throw new Error("not implemented");
}
