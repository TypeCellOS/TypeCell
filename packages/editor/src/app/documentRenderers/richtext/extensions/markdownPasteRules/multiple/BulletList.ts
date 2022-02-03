import { BulletList } from "@tiptap/extension-bullet-list";
import multipleLineMarkdownRuleBuilder from "./markdownMultipleLines";

/**
 * Configure BulletList for markdown(* or - or + ) parsing
 */
const MarkdownBulletList = BulletList.extend({
  addProseMirrorPlugins() {
    return [
      multipleLineMarkdownRuleBuilder(
        "mdBulletList",
        // This merge function maps each fragmented text into a separate ListItem node
        // and the entire list of ListItems is converted into a BulletList node
        (editor, accumulatedText) => {
          const items = accumulatedText.map((listContent) => {
            const paragraphText = editor.schema.text(listContent);
            const paragraph = editor.schema.node(
              "paragraph",
              {},
              paragraphText
            );
            return editor.schema.node("listItem", {}, [paragraph]);
          });
          const convertedNode = editor.schema.node("bulletList", {}, items);
          return convertedNode;
        },
        // any consecutive lines that start with - + or * and a space
        new RegExp(`^\\s?[\\-\\+\\*] `),
        this.editor
      ),
    ];
  },
});

export default MarkdownBulletList;
