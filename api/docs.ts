import * as fs from "fs";
import * as path from "path";

export default function (req: any, res: any) {
  let dirfiles = fs.readdirSync(path.join(__dirname, "docs"));
  let rootfiles = fs.readdirSync(".");
  res.json({
    dirfiles,
    rootfiles,
    body: req.body,
  });
}
