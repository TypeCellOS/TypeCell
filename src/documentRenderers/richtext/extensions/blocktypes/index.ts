import { Node, NodeConfig, NodeViewRendererProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import Block from "./Block";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import { IndentItem } from "./IndentItem";
import { TypeCellNode } from "../typecellnode";
import MarkdownHeading from "../markdownPasteRules/single/Heading";
import MarkdownHorizontalRule from "../markdownPasteRules/single/Horizontal";
import MarkdownBlockquote from "../markdownPasteRules/multiple/BlockQuote";
import MarkdownBulletList from "../markdownPasteRules/multiple/BulletList";
import MarkdownOrderedList from "../markdownPasteRules/multiple/OrderedList";
import MarkdownCodeBlock from "../markdownPasteRules/multiple/CodeBlock";

type PlaceholderOptions = {
  placeholder?: string;
  placeholderOnlyWhenSelected?: boolean;
};

export function extendAsBlock<NodeOptions>(
  node: Node<NodeOptions>,
  extendedConfig?: Partial<NodeConfig<NodeOptions & PlaceholderOptions>>
) {
  return node.extend<NodeOptions & PlaceholderOptions>({
    addAttributes() {
      return {
        "block-id": {
          default: null,
          rendered: false,
        },
        ...this.parent?.(),
      };
    },

    addNodeView() {
      // TODO? If we don't have a block-id, we don't really need the node-view wrapper with all corresponding <div>s
      // https://github.com/YousefED/typecell-next/issues/57
      return (props: NodeViewRendererProps) => {
        const renderer = ReactNodeViewRenderer(
          Block(this.type.spec.toDOM!, this.options),
          {
            stopEvent:
              props.node.type.name === "typecell" ? (event) => true : undefined,
          }
        )(props);
        if (props.node.type.name === "typecell") {
          (renderer as any).ignoreMutation = () => {
            return true;
          };
          (renderer as any).contentDOMElement = null;
        }
        return renderer;
      };
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

export const BlockQuoteBlock = extendAsBlock(MarkdownBlockquote, {
  // only allow paragraphs in blockquote elements
  content: "paragraph+",
});

export const ListItemBlock = extendAsBlock(ListItem, {
  // TODO: the tiptap default is "paragraph block*"
  // It would be nicer to have paragraph list?, but that breaks backspace behavior
  //   content: "paragraph list?",
});
export const CodeBlockBlock = extendAsBlock(MarkdownCodeBlock);
export const HorizontalRuleBlock = extendAsBlock(MarkdownHorizontalRule);
export const HeadingBlock = extendAsBlock(MarkdownHeading);
export const ParagraphBlock = extendAsBlock(Paragraph);

export const IndentItemBlock = extendAsBlock(IndentItem);
export const TypeCellNodeBlock = extendAsBlock(TypeCellNode);
export const BulletList = extendAsBlock(MarkdownBulletList);
export const OrderedList = extendAsBlock(MarkdownOrderedList);
