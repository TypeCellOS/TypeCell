import { ContentBlock, Block, BlockGroup } from "./Block";
import { Node, mergeAttributes, textblockTypeInputRule } from "@tiptap/core";

export const blocks: any[] = [
  ContentBlock,
  Block,
  BlockGroup,
  Node.create({
    name: "doc",
    topNode: true,
    content: "blockGroup",
  }),
];
