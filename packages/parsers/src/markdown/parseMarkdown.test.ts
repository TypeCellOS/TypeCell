import * as glob from "fast-glob";
import * as fs from "fs";
import { describe, expect, it } from "vitest";
import { markdownToDocument } from "./parseMarkdown";
describe("parseMarkdown", () => {
  const mds = glob.sync("tests/data/markdown/**/*.md");
  mds.forEach((md) => {
    it("converts " + md, () => {
      const data = fs.readFileSync(md, "utf-8");
      const converted = markdownToDocument(data);
      expect(converted).toMatchSnapshot();
    });
  });
});
