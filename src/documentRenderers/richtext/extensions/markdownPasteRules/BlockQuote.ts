import { Editor } from "@tiptap/core";
import multipleLineMarkdownRuleBuilder from "./MultipleLines";

const nodeCreation = (editor: Editor, accumulatedText: string[]) => {
  const fragContent = editor.schema.node(
    "paragraph",
    {},
    editor.schema.text(accumulatedText.join(" "))
  );
  const convertedNode = editor.schema.node("blockquote", {}, [fragContent]);
  return convertedNode;
};

const markdownBlockQuote = multipleLineMarkdownRuleBuilder(
  "markdownPasteRuleBlockQuote",
  nodeCreation
);
export default markdownBlockQuote;
