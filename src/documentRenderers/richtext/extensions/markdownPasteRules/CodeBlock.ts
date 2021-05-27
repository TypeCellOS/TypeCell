import { Editor } from "@tiptap/core";
import multipleLineMarkdownRuleBuilder from "./MultipleLines";

const nodeCreation = (editor: Editor, accumulatedText: string[]) => {
  const fragContent = editor.schema.text(accumulatedText.join("\n"));
  const convertedNode = editor.schema.node("codeBlock", {}, [fragContent]);
  return convertedNode;
};

const markdownCodeBlock = multipleLineMarkdownRuleBuilder(
  "markdownPasteRuleCodeBlock",
  nodeCreation
);

export default markdownCodeBlock;
