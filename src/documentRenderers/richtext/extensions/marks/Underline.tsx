import { Command, Mark, mergeAttributes } from "@tiptap/core";

/**
 * This file structure is copied from the TipTap code for bold and italic
 * https://github.com/ueberdosis/tiptap/blob/main/packages/extension-italic/src/italic.ts
 *
 * Key is 'Mod-u' (ctrl or command + u)
 */
export interface UnderlineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands {
    underline: {
      /**
       * Set an underline mark
       */
      setUnderline: () => Command;
      /**
       * Toggle an underline mark
       */
      toggleUnderline: () => Command;
      /**
       * Unset an underline mark
       */
      unsetUnderline: () => Command;
    };
  }
}

export const Underline = Mark.create<UnderlineOptions>({
  name: "underline",

  defaultOptions: {
    HTMLAttributes: {},
  },

  parseHTML() {
    return [
      {
        tag: "u",
        getAttrs: (node) =>
          (node as HTMLElement).style.fontStyle !== "normal" && null,
      },
      {
        style: "text-decoration=underline",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "u",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setUnderline: () => ({ commands }) => {
        return commands.setMark("underline");
      },
      toggleUnderline: () => ({ commands }) => {
        return commands.toggleMark("underline");
      },
      unsetUnderline: () => ({ commands }) => {
        return commands.unsetMark("underline");
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleUnderline(),
    };
  },
});
