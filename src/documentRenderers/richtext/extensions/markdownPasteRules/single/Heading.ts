import { Heading } from "@tiptap/extension-heading";
import singleLineMarkdownRuleBuilder from "./markdownSingleLine";

const MarkdownHeading = Heading.extend({
  addPasteRules() {
    return [
      singleLineMarkdownRuleBuilder(
        "mdHeading",
        (editor, match, text) => {
          const markdownSymbols = match[0];
          const content = text.slice(markdownSymbols.length);
          const fragContent = editor.schema.text(content);
          const level = markdownSymbols.length - 1;
          return [
            editor.schema.node("heading", { level: level }, [fragContent]),
          ];
        },
        // any consecutive lines that start with 1-6 # and a space
        new RegExp(`^(#{1,6})\\s`),
        this.editor
      ),
    ];
  },
});

export default MarkdownHeading;
