import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment } from "prosemirror-model";
import { Editor } from "@tiptap/core";

const singleLineMarkdownRuleBuilder = (
  pluginKey: string,
  convertToNode: (editor: Editor, match: RegExpExecArray, text: string) => any
) => {
  return (editor: Editor, regexp: RegExp) => {
    const markdown = (fragment: Fragment): Fragment => {
      const convertedNodes: any[] = [];

      fragment.forEach((child) => {
        const innerTextBlock = child.firstChild;
        if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text) {
          const text = innerTextBlock.text;
          let match = regexp.exec(text);

          if (match !== null) {
            const convertedNode = convertToNode(editor, match, text);
            convertedNodes.push(convertedNode);
          } else {
            convertedNodes.push(child);
          }
        } else {
          convertedNodes.push(child);
        }
      });

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

export default singleLineMarkdownRuleBuilder;
