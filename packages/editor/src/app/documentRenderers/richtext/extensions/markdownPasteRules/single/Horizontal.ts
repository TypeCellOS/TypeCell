import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import singleLineMarkdownRuleBuilder from "./markdownSingleLine";

/**
 * Configure HorizontalRule for markdown(--- or ___ or ***) parsing
 */
const MarkdownHorizontalRule = HorizontalRule.extend({
  addProseMirrorPlugins() {
    return [
      singleLineMarkdownRuleBuilder(
        "mdHorizontal",
        // This conversion function creates a horizontalRule node and an empty paragraph node
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
