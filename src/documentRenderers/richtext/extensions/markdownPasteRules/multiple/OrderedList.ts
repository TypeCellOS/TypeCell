import { OrderedList } from "@tiptap/extension-ordered-list";
import multipleLineMarkdownRuleBuilder from "./markdownMultipleLines";

/**
 * Configure OrderedList for markdown(1. or 2. etc.) parsing
 */
const MarkdownOrderedList = OrderedList.extend({
  addPasteRules() {
    return [
      multipleLineMarkdownRuleBuilder(
        "mdOrderedList",
        // This merge function maps each fragmented text into a ListItem node
        // the entire list is converted into a OrderedList node
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
          const convertedNode = editor.schema.node("orderedList", {}, items);
          return convertedNode;
        },
        // any consecutive lines that start with a number, a period and a space
        new RegExp(`^\\d+. `),
        this.editor
      ),
    ];
  },
});

export default MarkdownOrderedList;
