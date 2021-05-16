import { Node, NodeConfig } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ElementType } from "react";
import Block from "./BlockNodeView";
import BlockQuote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import ListItem from "@tiptap/extension-list-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";

export function extendAsBlock(
  node: Node,
  tag: ElementType,
  extendedConfig?: Partial<NodeConfig<any>>
) {
  return node.extend({
    addAttributes() {
      return { "block-id": null };
    },

    addNodeView() {
      return ReactNodeViewRenderer(Block(tag));
    },
    ...extendedConfig,
  });
}

export const BlockQuoteBlock = extendAsBlock(BlockQuote, "blockquote", {
  content: "paragraph+",
});

export const CodeBlockBlock = extendAsBlock(CodeBlock, "code");
export const ListItemBlock = extendAsBlock(ListItem, "li", {
  // TODO: the tiptap default is "paragraph block*"
  // It would be nicer to have paragraph list?, but that breaks backspace behavior
  //   content: "paragraph list?",
});
export const HorizontalRuleBlock = extendAsBlock(HorizontalRule, "hr");
export const HeadingBlock = extendAsBlock(Heading, "h1");
export const ParagraphBlock = extendAsBlock(Paragraph, "p");
