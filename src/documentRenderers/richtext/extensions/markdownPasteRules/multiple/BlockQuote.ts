import { Blockquote } from "@tiptap/extension-blockquote";
import multipleLineMarkdownRuleBuilder from "./markdownMultipleLines";

const MarkdownBlockquote = Blockquote.extend({
  addPasteRules() {
    return [
      multipleLineMarkdownRuleBuilder(
        "mdBlockquote",
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
