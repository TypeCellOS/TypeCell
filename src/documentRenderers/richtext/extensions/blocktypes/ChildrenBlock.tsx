import BlockQuote from "@tiptap/extension-blockquote";
import { mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import { Node } from "@tiptap/core";

export interface ChildrenBlockOptions {
  HTMLAttributes: Record<string, any>;
}

const ChildrenBlock = Node.create<ChildrenBlockOptions>({
  name: "childrenblock",
  content: "block+",
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
});

export default ChildrenBlock;
