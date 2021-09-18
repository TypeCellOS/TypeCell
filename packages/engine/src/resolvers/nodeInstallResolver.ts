import * as cp from "child_process";
import * as os from "os";
import * as path from "path";

/**
 * This resolver can be used when using the engine server-side on NodeJS
 * @param moduleName
 */
export async function resolveImport(moduleName: string) {
  if (moduleName.startsWith("https://")) {
    throw new Error("not implemented http imports on node.js");
  }
  if (moduleName.startsWith("!@")) {
    throw new Error("not implemented serverside");
  }

  try {
    // built in node module?
    return await import(moduleName);
  } catch (e) {
    // install module
    const dir = os.tmpdir();
    // engineLogger.log("npm install " + moduleName);
    await cp.execSync("npm install " + moduleName, { cwd: dir });
    // engineLogger.log("installed", moduleName);
    return import(path.join(dir, "node_modules", moduleName));
  }
}
