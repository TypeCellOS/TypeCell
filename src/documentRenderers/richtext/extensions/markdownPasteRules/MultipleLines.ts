import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment } from "prosemirror-model";
import { Editor } from "@tiptap/core";

/**
 * parse all the nodes and merge when necessary. All examples below are about quote block: "> "
 * but other blocks that can span multiple lines like bullet lists work similarly
 *
 * Imagine the following markdown source:
 * random plain text... this is a paragraph node
 * > a quotation that should
 * > not be split into 2 nodes
 * other text... this is another paragraph node
 *
 * they will firstly be separate nodes that contain texts, but in processing them
 * consecutive lines with the same markdown syntax "> " will be extracted and the
 * textual parts will be merged into one single quote block.
 *
 * further adapted from "./SingleLine.ts"
 * @param pluginKey : the key of this plugin
 * @param mergeTextsIntoNode : the function that will do the specific merging work
 * @returns a function that will be fed into addPasteRules
 */
const multipleLineMarkdownRuleBuilder = (
  pluginKey: string,
  mergeTextsIntoNode: (editor: Editor, accumulatedText: string[]) => any
) => {
  return (editor: Editor, regexp: RegExp) => {
    const markdown = (fragment: Fragment): Fragment => {
      const convertedNodes: any[] = [];
      const EMPTY = "";

      // firstly map all nodes into plain texts, put them into this array texts
      let texts: string[] = [];
      fragment.forEach((child) => {
        const innerTextBlock = child.firstChild;
        if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text)
          texts.push(innerTextBlock.text);
        else texts.push(EMPTY);
      });

      // this array will buffer all texts with the same markdown syntax
      // e.g. upon processing numerous contiguous lines like:
      // > quote that should not
      // > be split into 2 nodes
      // the accumulatedText array stores: ["quote that should not", "be split into 2 nodes"]
      let accumulatedText: string[] = [];

      // process each line with the help of the buffer and text array above
      fragment.forEach((child, offset, index) => {
        const rawTextContent = texts[index];
        let match = regexp.exec(rawTextContent);

        if (match !== null) {
          // if the line starts with, for example, "> ", put the remaining text into the buffer
          const markdownSymbols = match[0];
          const textContent = rawTextContent.slice(markdownSymbols.length);
          accumulatedText.push(textContent);
        }

        // the current line is not matched with, e.g., "> "
        else {
          // before pushing this child, check if the buffer is empty
          // if it has some texts in there, they constitute a node that should come before the current node
          // so before pushing this current node, merge all texts of the buffer into a node by
          // calling this particular function mergeTextsIntoQuote
          if (accumulatedText.length > 0) {
            const newNode = mergeTextsIntoNode(editor, accumulatedText);
            // clear the buffer and put that just merged node into convertedNodes
            accumulatedText = [];
            convertedNodes.push(newNode);
          }
          // now put the current node into convertedNode
          convertedNodes.push(child);
        }
      });

      // it could be that a line starting with "> " is the last node,
      // so the buffer must be finally checked again for merging
      if (accumulatedText.length > 0) {
        const newNode = mergeTextsIntoNode(editor, accumulatedText);
        accumulatedText = [];
        convertedNodes.push(newNode);
      }

      return Fragment.fromArray(convertedNodes);
    };

    return new Plugin({
      key: new PluginKey(pluginKey),
      props: {
        transformPasted: (slice) => {
          return new Slice(
            markdown(slice.content),
            slice.openStart,
            slice.openEnd
          );
        },
      },
    });
  };
};

export default multipleLineMarkdownRuleBuilder;
