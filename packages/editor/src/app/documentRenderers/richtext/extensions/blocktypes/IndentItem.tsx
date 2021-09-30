import { Node, mergeAttributes } from "@tiptap/core";

export interface IIndentItem {
  HTMLAttributes: Record<string, any>;
}

/**
 * An IndentItem is a child of IndentGroup.
 * It can be seen as the equivallent of a ListItem, but then for IndentGroups
 * In fact, this file is almost a copy of TipTap's ListItem
 */
export const IndentItem = Node.create<IIndentItem>({
  name: "indentItem",

  defaultOptions: {
    HTMLAttributes: {},
  },

  content: "block*",

  defining: true,

  parseHTML() {
    return [
      {
        tag: "div",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem("indentItem"),
      Tab: () => this.editor.commands.sinkListItem("indentItem"),
      "Shift-Tab": () => this.editor.commands.liftListItem("indentItem"),
    };
  },
});
