import { Editor } from "@tiptap/core";
import multipleLineMarkdownRuleBuilder from "./MultipleLines";

const nodeCreation = (editor: Editor, accumulatedText: string[]) => {
  const items = accumulatedText.map((listContent) => {
    const paragraphText = editor.schema.text(listContent);
    const paragraph = editor.schema.node("paragraph", {}, paragraphText);
    return editor.schema.node("listItem", {}, [paragraph]);
  });
  const convertedNode = editor.schema.node("bulletList", {}, items);
  return convertedNode;
};

const markdownBulletList = multipleLineMarkdownRuleBuilder(
  "markdownPasteRuleBulletList",
  nodeCreation
);
export default markdownBulletList;
