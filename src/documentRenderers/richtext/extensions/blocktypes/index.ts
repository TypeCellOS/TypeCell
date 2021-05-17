import { Node, NodeConfig } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
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
  extendedConfig?: Partial<NodeConfig<any>>
) {
  return node.extend({
    addAttributes() {
      return { "block-id": null, ...this.parent?.() };
    },

    addNodeView() {
      // TODO? If we don't have a block-id, we don't really need the node-view wrapper with all corresponding <div>s
      // https://github.com/YousefED/typecell-next/issues/57
      return ReactNodeViewRenderer(Block(this.type.spec.toDOM!, this.options));
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

export const BlockQuoteBlock = extendAsBlock(BlockQuote, {
  // only allow paragraphs in blockquote elements
  content: "paragraph+",
});

export const CodeBlockBlock = extendAsBlock(CodeBlock);
export const ListItemBlock = extendAsBlock(ListItem, {
  // TODO: the tiptap default is "paragraph block*"
  // It would be nicer to have paragraph list?, but that breaks backspace behavior
  //   content: "paragraph list?",
});
export const HorizontalRuleBlock = extendAsBlock(HorizontalRule);
export const HeadingBlock = extendAsBlock(Heading);
export const ParagraphBlock = extendAsBlock(Paragraph);
export const IndentItemBlock = extendAsBlock(IndentItem);
