import { Node } from "@tiptap/core";
import { Command, mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import TypeCellComponent from "./TypeCellComponent";
import { wrappingInputRule } from "prosemirror-inputrules";

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

export default Node.create({
  // configuration …
  name: "typecell",
  group: "block",

  // NOTE: probably something wrong with this configuration?
  content: "block*",
  //    content: 'inline*', al
  defining: true,
  atom: true,
  addNodeView() {
    return ReactNodeViewRenderer(TypeCellComponent);
  },

  addCommands() {
    return {
      test: () => ({ commands }) => {
        return commands.insertContent({ type: "typecell" });
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      m: () =>
        this.editor.chain().insertContent("<typecell>test</typecell>").run(),
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
