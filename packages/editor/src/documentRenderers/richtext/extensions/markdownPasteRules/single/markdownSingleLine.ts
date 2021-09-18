import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment } from "prosemirror-model";
import { Editor } from "@tiptap/core";

/**
 * parse each node separately, inline text will be mapped to exactly one node
 *
 * Imagine the following markdown source:
 * random text... this is a paragraph node
 * ## heading2 ... this is one H2 node
 * ### heading3 ... this is one H3 node
 * other text... this is another paragraph node
 *
 * adapted from: https://github.com/ueberdosis/tiptap/blob/main/packages/core/src/pasteRules/markPasteRule.ts
 * @param pluginKey : the key of this plugin
 * @param convertToNode : the function that convert one line of text into one node
 * @param regexp : the regular expression used to match the markdown syntax
 * @param editor : the editor object
 * @returns a function that will be fed into addPasteRules
 */
const singleLineMarkdownRuleBuilder = (
  pluginKey: string,
  convertToNode: (editor: Editor, match: RegExpExecArray, text: string) => any,
  regexp: RegExp,
  editor: Editor
) => {
  const markdown = (fragment: Fragment): Fragment => {
    const convertedNodes: any[] = [];

    // This function will match the text one node at a time, since they are all independent.
    fragment.forEach((child) => {
      const innerTextBlock = child.firstChild;
      // if this is a plain paragraph node that contains texts
      if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text) {
        // get the text for further processing
        const text = innerTextBlock.text;
        let match = regexp.exec(text);

        if (match !== null) {
          // the logic of converting the text into a proper node is implemented differently
          // the horizontal rule "--- " will emit an horizontalRule node
          // headings "## " will generate a heading node with corresponding level
          const convertedNode = convertToNode(editor, match, text);
          convertedNodes.push(...convertedNode);
        } else {
          convertedNodes.push(child);
        }
      } else {
        // this is not text node that can be properly transformed
        convertedNodes.push(child);
      }
    });

    return Fragment.fromArray(convertedNodes);
  };

  return new Plugin({
    key: new PluginKey(pluginKey),
    props: {
      // this function will be called when a user pastes something
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

export default singleLineMarkdownRuleBuilder;
