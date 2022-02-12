import { Node } from "@tiptap/core";
import { Block, BlockGroup, ContentBlock } from "./Block";

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
