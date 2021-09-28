import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import lowlight from "lowlight";
import multipleLineMarkdownRuleBuilder from "./markdownMultipleLines";
import "./CodeBlock.module.css";

/**
 * Configure CodeBlockLowlight for markdown(4 whitespaces/tab) parsing
 */
const MarkdownCodeBlock = CodeBlockLowlight.configure({ lowlight }).extend({
  addPasteRules() {
    return [
      multipleLineMarkdownRuleBuilder(
        "mdCodeBlock",
        // This merge function concatenates all fragmented texts with a new line
        // and the entire chunk is put in a CodeBlock node
        (editor, accumulatedText) => {
          const fragContent = editor.schema.text(accumulatedText.join("\n"));
          const convertedNode = editor.schema.node("codeBlock", {}, [
            fragContent,
          ]);
          return convertedNode;
        },
        // any consecutive lines that start with a tab or 4 spaces
        new RegExp(`^\\s{4}|\t`),
        this.editor
      ),
    ];
  },
});

export default MarkdownCodeBlock;
