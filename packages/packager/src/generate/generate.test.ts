import * as glob from "fast-glob";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, test } from "vitest";
import { createProjectFromMarkdown } from "./generate";

const TMP_DIR = process.env["RUNNER_TEMP"] || os.tmpdir();
const DEST_DIR = fs.mkdtempSync(path.join(TMP_DIR, "generate-test-"));
const ROOT_DIR = path.resolve(__dirname + "../../../../../");

describe(
  "generate test",
  () => {
    const mds = glob.sync(
      path.join(ROOT_DIR, "shared/test-data/markdown/**/*.md")
    );
    mds.forEach((md) => {
      if (md.includes("plainMarkdown.md")) {
        test.skip("converts " + path.basename(md)); // TODO
        return;
      }
      it("converts " + path.basename(md), async () => {
        const data = fs.readFileSync(md, "utf-8");

        const name = path.parse(md).name.toLowerCase();
        const dest = path.join(DEST_DIR, name);

        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
        }
        // fs.removeSync.rmdirSync(dest, {})
        console.log("createProjectFromMarkdown", dest);
        await createProjectFromMarkdown(name, data, dest);
      });
    });
  },
  { timeout: 30000 }
);
