import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { Parent } from "unist";

export function markdownToNotebook(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown);
  const nodes = (tree as Parent).children;
  const markdownAndCodeCells: Array<
    | {
        type: "code";
        node: any;
      }
    | {
        type: "markdown";
        nodes: any[];
      }
  > = [];
  for (let node of nodes) {
    if (node.type === "code") {
      markdownAndCodeCells.push({
        type: "code",
        node,
      });
    } else {
      let lastCell = markdownAndCodeCells[markdownAndCodeCells.length - 1];
      if (!lastCell || lastCell.type === "code") {
        lastCell = {
          type: "markdown",
          nodes: [],
        };
        markdownAndCodeCells.push(lastCell);
      }
      lastCell.nodes.push(node);
    }
  }

  let data = markdownAndCodeCells.map((cell) => {
    if (cell.type === "markdown") {
      const root: Parent = {
        type: "root",
        children: cell.nodes,
      };
      const md = unified()
        .use(remarkStringify)
        .stringify(root) as any as string;
      return md;
    }
    return cell;
  });
  return data;
}
