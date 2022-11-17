import {
  cellsWithId,
  CellWithId,
  Document,
  extensionForLanguage,
  markdownToDocument,
} from "@typecell-org/parsers";
import type globType from "fast-glob";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  getModulesFromPatchedFile,
  patchJSFileForTypeCell,
  patchJSFileWithWrapper,
} from "./patchJavascript.js";
import { spawnCmd } from "./process.js";

import glob from "fast-glob";
const syncGlob = glob.sync as typeof globType["sync"];

const NPM_PATH = process.env.LAMBDA_TASK_ROOT ? "/var/lang/bin/npm" : "npm";
const NPM_ENV = process.env.LAMBDA_TASK_ROOT
  ? {
      HOME: "/tmp/home",
      PATH: "/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin",
    }
  : undefined;

const dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(dirname + "../../../template");

function getCellDirectory(projectDir: string) {
  return path.join(projectDir, "src-notebook", "cells");
}

function getBuiltCellDirectory(projectDir: string) {
  return path.join(projectDir, "build", "notebook");
}

function getFilenameForCell(
  cell: CellWithId,
  extension = extensionForLanguage(cell.language)
) {
  return "cell_" + cell.id + "." + extension;
}

async function exportCell(projectDir: string, cell: CellWithId) {
  if (cell.language === "typescript") {
    const filepath = path.join(
      getCellDirectory(projectDir),
      getFilenameForCell(cell)
    );
    fs.writeFileSync(filepath, cell.code);
    return {
      ...cell,
      filepath,
      nameWithoutExtension: path.parse(filepath).name,
    };
  }
  throw new Error("only typescript cells should be exported");

  // else if (cell.language === "markdown") {
  //   const p = path.join(
  //     getCellDirectory(projectDir),
  //     "cell_" + cell.id + "." + extensionForLanguage(cell.language) + ".tsx"
  //   );
  //   const code = ``
  //   fs.writeFileSync(p, cell.code);
  // }
}

type ExportedCell = CellWithId & {
  filepath: string;
  nameWithoutExtension: string;
};

async function generateContextTSFile(
  projectDir: string,
  cells: ExportedCell[]
) {
  const codeImports = cells.map(
    (cell) =>
      `import type * as ${cell.nameWithoutExtension} from "../cells/${cell.nameWithoutExtension}";`
  );

  const code = cells.map(
    (cell) => `
    
type nodefault_${cell.nameWithoutExtension} = Omit<typeof ${cell.nameWithoutExtension}, "default">;
export interface IContext extends nodefault_${cell.nameWithoutExtension} {};`
  );

  const contents = `/// <reference path="./global.d.ts" />

${codeImports.join("\n")}
${code.join("")}`;

  // export type Context = ${names.join(" & ")};`;

  const cellsOutDir = path.join(projectDir, "src-notebook", "types");
  fs.writeFileSync(path.join(cellsOutDir, "context.d.ts"), contents);
}

async function generateMainTSFile(projectDir: string, cells: ExportedCell[]) {
  const buildDir = getBuiltCellDirectory(projectDir);
  const cellsOutDir = path.join(projectDir, "src", "generated");

  const codeImports = cells.map((cell) => {
    const builtPath = path.join(buildDir, getFilenameForCell(cell));
    const relPath = path.relative(cellsOutDir, builtPath);
    const relPathParsed = path.parse(relPath);
    return `import * as ${cell.nameWithoutExtension} from "${path.join(
      relPathParsed.dir,
      cell.nameWithoutExtension
    )}";`;
  });

  const exportDefault = `export default [${cells
    .map((c) => c.nameWithoutExtension)
    .join(",")}].map(mod => (mod as any).default);`;

  const contents = `
${codeImports.join("\n")}
  
${exportDefault}`;

  fs.writeFileSync(path.join(cellsOutDir, "cellFunctions.ts"), contents);
}

async function compileTypescriptCells(projectDir: string) {
  if (!fs.existsSync("/tmp/home")) {
    fs.mkdirSync("/tmp/home");
  }

  // await spawnCmd("/var/lang/bin/npm", ["--v"], undefined, {
  //   cwd: "/tmp",
  //   env: {
  //     HOME: "/tmp/home",
  //     PATH: "/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin",
  //   },
  //   // stdio: "inherit",
  // });

  console.log("exists" + fs.existsSync(path.join(projectDir, "package.json")));
  console.log("npm install");
  await spawnCmd(NPM_PATH, ["install", "--no-progress"], undefined, {
    cwd: projectDir,
    env: NPM_ENV,
    // stdio: "inherit",
  });

  // console.log("npm install returned", ret.status);
  // console.log("stdout", ret.stdout?.toString("utf-8"));
  // console.log("stderr", ret.stderr?.toString("utf-8"));
  // ret.output.map((o) => console.log("output", o?.toString("utf-8")));

  // if (ret.status || ret.error) {
  //   throw new Error("spawn failed");
  // }

  console.log("npm run cells:compile");
  await spawnCmd(NPM_PATH, ["run", "cells:compile"], undefined, {
    cwd: projectDir,
    env: NPM_ENV,
    // stdio: "inherit",
  });
}

async function buildProject(projectDir: string) {
  console.log("npm install");
  await spawnCmd(NPM_PATH, ["install", "--no-progress"], undefined, {
    cwd: projectDir,
    env: NPM_ENV,
    // stdio: "inherit",
  });

  console.log("npm run build");
  await spawnCmd(NPM_PATH, ["run", "build"], undefined, {
    cwd: projectDir,
    env: NPM_ENV,
    // stdio: "inherit",
  });
}

async function patchJSOutput(projectDir: string) {
  const dir = getBuiltCellDirectory(projectDir);
  console.log(syncGlob);
  const files = syncGlob("*.js", { cwd: dir });

  files.forEach((f) => patchJSFileForTypeCell(path.join(dir, f)));
}

async function patchJSOutputWrap(projectDir: string) {
  const dir = getBuiltCellDirectory(projectDir);
  const files = syncGlob("*.js", { cwd: dir });

  files.forEach((f) => patchJSFileWithWrapper(path.join(dir, f)));
}

async function getDependencies(projectDir: string) {
  const dir = getBuiltCellDirectory(projectDir);
  const files = syncGlob("*.js", { cwd: dir });

  const allModules = await Promise.all(
    files.map((f) => getModulesFromPatchedFile(path.join(dir, f)))
  );

  const deps = allModules.flat().flatMap((m) => m.dependencyArray);
  const depsSet = new Set(deps);
  depsSet.delete("require");
  depsSet.delete("exports");
  return depsSet;
}

async function patchPlaceholders(packagename: string, filename: string) {
  let contents = fs.readFileSync(filename, "utf-8");
  contents = contents.replaceAll("PACKAGENAME", packagename);
  fs.writeFileSync(filename, contents);
}

async function updatePackageJSON(
  name: string,
  deps: Set<string>,
  projectDir: string
) {
  const filename = path.join(projectDir, "package.json");
  const code = fs.readFileSync(filename, "utf-8");
  const packageJSON = JSON.parse(code);

  for (let dep of deps) {
    packageJSON.dependencies[dep] = "latest";
  }

  const engineLocation = path.resolve(dirname + "../../../../engine");
  packageJSON.dependencies["@typecell-org/engine"] = "file:" + engineLocation;
  fs.writeFileSync(filename, JSON.stringify(packageJSON, undefined, 2));
}

async function writeModuleResolver(deps: Set<string>, projectDir: string) {
  const imports = [...deps].map((dep, i) => {
    return `import * as import${i} from "${dep}";`;
  });

  const cases = [...deps].map((dep, i) => {
    return `    case "${dep}":
      return import${i};`;
  });

  const code = `${imports.join("\n")}

export async function resolveImport(module: string) {
  switch(module) {
${cases.join("\n")}
    default:
      throw new Error("import not found");
  }
}`;

  const outFile = path.join(projectDir, "src", "generated", "resolveImport.ts");
  fs.writeFileSync(outFile, code);
}

export async function createProject(
  name: string,
  tcDocument: Document,
  projectDir: string
) {
  if (!/^[a-z\-\_0-9]+$/.test(name)) {
    throw new Error("invalid name for project");
  }

  // copy files
  fs.mkdirSync(projectDir);
  fs.cpSync(SOURCE_DIR, projectDir, { recursive: true });
  console.log(SOURCE_DIR);

  // generate src-notebook directory from document
  const cells = cellsWithId(tcDocument.cells);

  // Step 1: Write tsx files for all Typescript cells
  const exported = await Promise.all(
    cells
      .filter((c) => c.language === "typescript")
      .map((c) => exportCell(projectDir, c))
  );

  let deps = new Set<string>();
  if (exported.length) {
    // Step 2: generate helper file for notebook project with the $ interface
    await generateContextTSFile(projectDir, exported);

    // Step 3: Compile the cells to javascript (AMD)
    // This uses npm run cells:compile in the template project
    // We ignore errors about missing libraries, as those will be added to the package.json later (step 9)
    await compileTypescriptCells(projectDir);

    // Step 4: Make define async and add scope imports
    await patchJSOutput(projectDir);

    // we can now get the dependencies (using the patched functions)
    // these are all the libraries that are imported by the cells
    deps = await getDependencies(projectDir);

    // Step 5: Add a wrapper function, so that instead of
    // directly exporting the module, we export a factory function that creates the module
    await patchJSOutputWrap(projectDir);

    // Step 6: add a ts file (cellFunctions.ts) that exports all cell factory functions
    await generateMainTSFile(projectDir, exported);
  }

  // Step 7: generate a module resolver based on deps
  await writeModuleResolver(deps, projectDir);

  // Step 8: Replace the project name in some files
  await patchPlaceholders(name, path.join(projectDir, "package.json"));
  await patchPlaceholders(name, path.join(projectDir, "index.html"));
  await patchPlaceholders(name, path.join(projectDir, "vite.config.ts"));

  // Step 9: add the dependencies to package.json
  await updatePackageJSON(name, deps, projectDir);

  // Step 10: build the project using vite
  // the build command suppresses errors about missing types of imported libraries
  // (because we don't add types yet to dev dependencies)
  await buildProject(projectDir);

  return {
    outputDir: projectDir,
  };
}

export async function createProjectFromMarkdown(
  name: string,
  markdown: string,
  projectDir: string
) {
  const converted = markdownToDocument(markdown);
  const data = await createProject(name, converted, projectDir);

  // add notebook source
  fs.writeFileSync(
    path.join(data.outputDir, "src-notebook", name + ".md"),
    markdown
  );
}

// build + transform ts files
// add package json

// create entry code
// build vite

/*
createProject() {

  createTSFiles() {

  }
  
  compileTSFiles() {
  
  }
  
  patchJSFiles() {
  
  }

  installAndBuild() {

  }
}



*/
