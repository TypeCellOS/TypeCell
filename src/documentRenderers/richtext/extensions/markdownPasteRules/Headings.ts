import { Editor } from "@tiptap/core";
import singleLineMarkdownRuleBuilder from "./SingleLine";

const convertToNode = (
  editor: Editor,
  match: RegExpExecArray,
  text: string
) => {
  const markdownSymbols = match[0];
  const content = text.slice(markdownSymbols.length);
  const fragContent = editor.schema.text(content);
  const level = markdownSymbols.length - 1;
  return editor.schema.node("heading", { level: level }, [fragContent]);
};

const markdownHeadings = singleLineMarkdownRuleBuilder(
  `markdownPasteRuleHeadings`,
  convertToNode
);

export default markdownHeadings;
