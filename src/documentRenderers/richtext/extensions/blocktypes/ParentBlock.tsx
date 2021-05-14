import BlockQuote from "@tiptap/extension-blockquote";
import { mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import { Node } from "@tiptap/core";

export interface ParentBlockOptions {
  HTMLAttributes: Record<string, any>;
}

const ParentBlock = Node.create<ParentBlockOptions>({
  name: "parentblock",
  group: "block",
  content: "block childrenblock",
  defaultOptions: {
    HTMLAttributes: {},
  },
  parseHTML() {
    return [{ tag: "div" }];
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
      // Enter: () => this.editor.commands.splitListItem("listItem"),
      Tab: () => this.editor.commands.sinkBlock("parentblock"),
      "Shift-Tab": () => this.editor.commands.liftListItem("parentblock"),
    };
  },
});

export default ParentBlock;
