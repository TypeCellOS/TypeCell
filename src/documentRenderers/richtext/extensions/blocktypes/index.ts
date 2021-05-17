import { Node, NodeConfig } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ElementType } from "react";
import Block from "./Block";
import BlockQuote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import ListItem from "@tiptap/extension-list-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import { IndentItem } from "./IndentItem";

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
      // TODO? If we don't have a block-id, we don't really need the node-view wrapper with all corresponding <div>s
      // https://github.com/YousefED/typecell-next/issues/57
      return ReactNodeViewRenderer(Block(tag, this.options));
    },

    addKeyboardShortcuts() {
      // These extra keyboard shortcuts are similar to ListItem
      // (https://github.com/ueberdosis/tiptap/blob/main/packages/extension-list-item/src/list-item.ts)
      return {
        // blocks should be "indentable" with Tab
        Enter: () => this.editor.commands.splitListItem("indentItem"),
        Tab: () =>
          this.editor.commands.first(({ commands }) => [
            () => commands.sinkListItem("indentItem"),
            () => commands.createIndentGroup(),
          ]),
        "Shift-Tab": () => this.editor.commands.liftListItem("indentItem"),

        // add parent keyboard shortcuts
        ...this.parent?.(),
      };
    },
    ...extendedConfig,
  });
}

export const BlockQuoteBlock = extendAsBlock(BlockQuote, "blockquote", {
  // only allow paragraphs in blockquote elements
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
export const IndentItemBlock = extendAsBlock(IndentItem, "div");
