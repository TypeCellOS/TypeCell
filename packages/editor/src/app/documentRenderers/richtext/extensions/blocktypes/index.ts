import { Node, NodeConfig } from "@tiptap/core";
import { ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react";
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
      return (props) => {
        if (!props.node.attrs["block-id"]) {
          // If we don't have a block-id, we don't really need the node-view wrapper with all corresponding <div>s
          return undefined as any;
        }
        const renderer = ReactNodeViewRenderer(
          Block(this.type.spec.toDOM!, this.options),
          {
            // don't use the built-in stopEvent from TipTap
            // because it messes with drag events
            // (we don't use tiptap / PM draggable)
            stopEvent(event) {
              const target = event.target as HTMLElement;
              const isInContentDomElement = (
                renderer as any
              ).contentDOM?.contains(target);
              if (isInContentDomElement) {
                // the event is in the contentDOM element.
                // Events there (e.g. paste, clicks) should be handled by PM
                return false;
              }
              const isInDomElement = (renderer as any).dom?.contains(target);

              if (!isInDomElement) {
                console.warn("unexpected, received event not in dom element");
              }
              // The event is in the element, but not in the contentDOM.
              // In this case we expect to handle the event in the React code of the NodeView
              // (e.g.: drag handle clicks)
              return true;
            },
          }
        )(props);
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
