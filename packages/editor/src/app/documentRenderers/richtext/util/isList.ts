import { Node } from "prosemirror-model";

// TODO: replace with tiptap version once exported: https://github.com/ueberdosis/tiptap/issues/1326
export function isList(node: Node) {
  return ((node.type as any).groups as string[]).includes("list");
}
