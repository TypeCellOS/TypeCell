import * as engine from "@typecell-org/engine";

import * as fs from "fs";

export async function patchJSFileForTypeCell(filepath: string) {
  const scope = engine.modules.createExecutionScope({} as any); // add fake scope, maybe getPatchedTypeCellCode should only require keys?
  const origCode = fs.readFileSync(filepath, { encoding: "utf-8" });
  const patchedCode = engine.modules.getPatchedTypeCellCode(origCode, scope);
  fs.writeFileSync(filepath, patchedCode);
}

export async function patchJSFileWithWrapper(filepath: string) {
  const origCode = fs.readFileSync(filepath, { encoding: "utf-8" });

  const wrappedCodeInExport = `export default function() { 
    ${origCode}
}`;

  fs.writeFileSync(filepath, wrappedCodeInExport);
}

// takes non-wrapped file
export async function getModulesFromPatchedFile(filepath: string) {
  const code = fs.readFileSync(filepath, { encoding: "utf-8" });
  return engine.modules.getModulesFromPatchedTypeCellCode(code, {});
}
