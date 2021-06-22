import { Blockquote } from "@tiptap/extension-blockquote";
import multipleLineMarkdownRuleBuilder from "./markdownMultipleLines";

/**
 * Configure Blockquote for markdown(> ) parsing
 */
const MarkdownBlockquote = Blockquote.extend({
  addPasteRules() {
    return [
      multipleLineMarkdownRuleBuilder(
        "mdBlockquote",
        // This merge function merges all fragmented texts with a whitespace
        // and the entire chunk is put into a blockquote node
        (editor, accumulatedText) => {
          const fragContent = editor.schema.node(
            "paragraph",
            {},
            editor.schema.text(accumulatedText.join(" "))
          );
          const convertedNode = editor.schema.node("blockquote", {}, [
            fragContent,
          ]);
          return convertedNode;
        },
        // any consecutive lines that start with > and a space
        new RegExp(`^\\s*>\\s`),
        this.editor
      ),
    ];
  },
});

export default MarkdownBlockquote;
