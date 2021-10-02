import glob from "glob";
import * as path from "path";
const files = glob.sync("**/*.md", { cwd: path.join("..", "..", "docs") });

console.log(JSON.stringify(files));
