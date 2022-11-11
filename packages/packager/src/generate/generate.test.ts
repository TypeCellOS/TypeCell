import * as glob from "fast-glob";
import * as fs from "fs";
import * as path from "path";
import { describe, it } from "vitest";
import { createProjectFromMarkdown } from "./generate";

const DEST_DIR = path.resolve(__dirname + "../../../tmp");
const ROOT_DIR = path.resolve(__dirname + "../../../../../");

describe(
  "generate test",
  () => {
    const mds = glob.sync(
      path.join(ROOT_DIR, "shared/test-data/markdown/**/*.md")
    );
    mds.forEach((md) => {
      it("converts " + md, async () => {
        const data = fs.readFileSync(md, "utf-8");

        const name = path.parse(md).name.toLowerCase();
        const dest = path.join(DEST_DIR, name);

        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
        }
        // fs.removeSync.rmdirSync(dest, {})

        await createProjectFromMarkdown(name, data, dest);
      });
    });
  },
  { timeout: 15000 }
);
