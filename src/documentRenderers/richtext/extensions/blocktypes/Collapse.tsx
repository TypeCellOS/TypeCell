import { Node, mergeAttributes, Command } from "@tiptap/core";
import { extendAsBlock } from ".";

export interface CollapseOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands {
    collapse: {
      /**
       * Set a collapse node
       */
      setCollapse: () => Command;
      /**
       * Toggle a collapse node
       */
      toggleCollapse: () => Command;
      /**
       * Unset a collapse node
       */
      unsetCollapse: () => Command;
    };
  }
}

const Collapse = Node.create<CollapseOptions>({
  name: "collapse",

  defaultOptions: {
    HTMLAttributes: {},
  },

  content: "block*",

  group: "block",

  defining: true,

  parseHTML() {
    return [{ tag: "blockquote" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "blockquote",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setCollapse:
        () =>
        ({ commands }) => {
          return commands.wrapIn("collapse");
        },
      toggleCollapse:
        () =>
        ({ commands }) => {
          return commands.toggleWrap("collapse");
        },
      unsetCollapse:
        () =>
        ({ commands }) => {
          return commands.lift("collapse");
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-q": () => this.editor.commands.toggleCollapse(),
    };
  },
});

export const CollapseBlock = extendAsBlock(Collapse).configure({
  placeholder: "Collapse",
});
