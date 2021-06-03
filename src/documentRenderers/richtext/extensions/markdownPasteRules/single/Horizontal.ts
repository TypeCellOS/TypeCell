import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import singleLineMarkdownRuleBuilder from "./markdownSingleLine";

const MarkdownHorizontalRule = HorizontalRule.extend({
  addPasteRules() {
    return [
      singleLineMarkdownRuleBuilder(
        "mdHorizontal",
        (editor, match, text) => {
          return [
            editor.schema.node("horizontalRule"),
            editor.schema.node("paragraph"),
          ];
        },
        // any consecutive lines that start with 3 or more - _ or *
        new RegExp(`^( ?[-_*]){3,}\\s*`),
        this.editor
      ),
    ];
  },
});

export default MarkdownHorizontalRule;
