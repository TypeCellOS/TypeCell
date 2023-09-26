import remarkParse from "remark-parse";
import { Root } from "remark-parse/lib";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { Cell, Document, Language } from "../models";

export function markdownRootToDocument(tree: Root): Document {
  const nodes = tree.children;
  const cells: Cell[] = [];

  for (const node of nodes) {
    if (node.type === "code") {
      const lang = node.lang;
      if (lang && lang !== "typescript" && lang !== "css") {
        throw new Error("invalid markdown code block language");
      }
      cells.push({
        language: (lang as Language) || "typescript",
        code: node.value,
      });
    } else {
      let lastCell = cells[cells.length - 1];
      if (!lastCell || lastCell.language !== "markdown") {
        lastCell = {
          language: "markdown",
          code: "",
        };
        cells.push(lastCell);
      }
      const root: Root = {
        type: "root",
        children: [node],
      };

      const md = unified().use(remarkStringify).stringify(root) as string;

      if (lastCell.code.length) {
        lastCell.code += "\n";
      }
      lastCell.code += md;
    }
  }

  return {
    cells,
  };
}

export function markdownToDocument(markdown: string): Document {
  const tree = unified().use(remarkParse).parse(markdown);
  return markdownRootToDocument(tree);
}
