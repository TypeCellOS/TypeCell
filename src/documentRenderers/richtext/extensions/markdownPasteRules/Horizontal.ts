import { Editor } from "@tiptap/core";
import singleLineMarkdownRuleBuilder from "./SingleLine";

const convertToNode = (
  editor: Editor,
  match: RegExpExecArray,
  text: string
) => {
  return editor.schema.node("horizontalRule", {}, undefined);
};

const markdownHorizontalRule = singleLineMarkdownRuleBuilder(
  `markdownPasteRuleHorizontal`,
  convertToNode
);

export default markdownHorizontalRule;
