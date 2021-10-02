import { Mark, mergeAttributes } from "@tiptap/core";
import styles from "../comments/Comments.module.css";

/**
 * This file structure is copied from the TipTap code for bold and italic
 * https://github.com/ueberdosis/tiptap/blob/main/packages/extension-italic/src/italic.ts
 *
 */
export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Set a comment mark
       */
      setComment: (id: string) => ReturnType;
    };
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: "comment",

  excludes: "",

  inclusive: false,

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
        tag: "span[class=" + styles.commentHighlight + "]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: styles.commentHighlight }),
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
    };
  },
});
