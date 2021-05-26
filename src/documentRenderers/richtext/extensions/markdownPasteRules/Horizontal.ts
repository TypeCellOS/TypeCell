import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment, NodeType } from "prosemirror-model";
import { Editor } from "@tiptap/core";

const markdownHorizontalRule = (
  editor: Editor,
  regexp: RegExp,
  name: string,
  getAttributes?:
    | Record<string, any>
    | ((match: RegExpExecArray) => Record<string, any>)
): Plugin => {
  const markdown = (fragment: Fragment): Fragment => {
    const convertedNodes: any[] = [];

    fragment.forEach((child) => {
      console.log(`one child of a fragment...`);
      const innerTextBlock = child.firstChild;
      if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text) {
        const text = innerTextBlock.text;
        let match = regexp.exec(text);

        if (match !== null) {
          const convertedNode = editor.schema.node(name);
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
    key: new PluginKey(`markdownPasteRuleHorizontal`),
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

export default markdownHorizontalRule;
