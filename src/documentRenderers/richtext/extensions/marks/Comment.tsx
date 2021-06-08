import { Command, Mark, mergeAttributes } from "@tiptap/core";

/**
 * This file structure is copied from the TipTap code for bold and italic
 * https://github.com/ueberdosis/tiptap/blob/main/packages/extension-italic/src/italic.ts
 *
 */
export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands {
    comment: {
      /**
       * Set a comment mark
       */
      setComment: (id: number) => Command;
      /**
       * Toggle a comment mark
       */
      toggleComment: () => Command;
      /**
       * Unset a comment mark
       */
      unsetComment: () => Command;
    };
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: "comment",

  excludes: "",

  addAttributes() {
    // Return an object with attribute configuration
    return {
      id: {
        default: null,
      },
    };
  },

  defaultOptions: {
    HTMLAttributes: {},
  },

  parseHTML() {
    return [
      {
        tag: "c",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "c",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (id) =>
        ({ commands }) => {
          return commands.setMark("comment", { id: id });
        },
      toggleComment:
        () =>
        ({ commands }) => {
          return commands.toggleMark("comment");
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark("comment");
        },
    };
  },
});
