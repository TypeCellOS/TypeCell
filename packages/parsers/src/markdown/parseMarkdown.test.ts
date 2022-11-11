import * as glob from "fast-glob";
import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { markdownToDocument } from "./parseMarkdown";

const ROOT_DIR = path.resolve(__dirname, "../../../../");

describe("parseMarkdown", () => {
  const mds = glob.sync(
    path.join(ROOT_DIR, "shared/test-data/markdown/**/*.md")
  );
  mds.forEach((md) => {
    it("converts " + md, () => {
      const data = fs.readFileSync(md, "utf-8");
      const converted = markdownToDocument(data);
      expect(converted).toMatchSnapshot();
    });
  });
});
