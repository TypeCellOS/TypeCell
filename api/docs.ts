import * as fs from "fs";

export default function (req: any, res: any) {
  let dirfiles = fs.readdirSync(__dirname);
  let rootfiles = fs.readdirSync(".");
  res.json({
    dirfiles,
    rootfiles,
    body: req.body,
  });
}
