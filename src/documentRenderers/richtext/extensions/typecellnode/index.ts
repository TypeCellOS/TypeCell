import { Node } from "@tiptap/core";
import { Command, mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import TypeCellComponent from "./TypeCellComponent";

export const inputRegex = /^\s*q\s$/gm;

declare module "@tiptap/core" {
  interface Commands {
    test: {
      /**
       * Toggle a paragraph
       */
      test: () => Command;
    };
  }
}

export const TypeCellNode = Node.create({
  // configuration …
  name: "typecell",
  group: "block",

  // NOTE: probably something wrong with this configuration?
  content: "text*",
  //    content: 'inline*', al
  defining: true,
  atom: true,

  // The node view is added in ../blocktypes/index.ts
  // addNodeView() {
  //   return ReactNodeViewRenderer(TypeCellComponent);
  // },

  addAttributes() {
    return {
      id: {
        default: undefined,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "typecell",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["typecell", mergeAttributes(HTMLAttributes)];
  },
  // addInputRules() {
  //     return [
  //       wrappingInputRule(inputRegex, this.type)
  //     ]
  //   },
});
