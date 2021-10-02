import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

export default function (req: any, res: any) {
  let dirfiles = glob.sync("**/*.md", { cwd: path.join(__dirname, "docs") });
  let rootfiles = fs.readdirSync(".");
  res.json({
    dirfiles,
    rootfiles,
    body: req.body,
  });
}
