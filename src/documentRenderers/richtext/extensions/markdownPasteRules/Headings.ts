import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment, NodeType } from "prosemirror-model";
import { Editor } from "@tiptap/core";

const markdownHeadings = function (
  editor: Editor,
  regexp: RegExp,
  type: NodeType,
  getAttributes?:
    | Record<string, any>
    | ((match: RegExpExecArray) => Record<string, any>)
): Plugin {
  const markdown = (fragment: Fragment): Fragment => {
    const convertedNodes: any[] = [];

    fragment.forEach((child) => {
      console.log(`one child of a fragment...`);
      const innerTextBlock = child.firstChild;
      if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text) {
        const text = innerTextBlock.text;
        let match = regexp.exec(text);

        if (match !== null) {
          const markdownSymbols = match[0];
          const content = text.slice(markdownSymbols.length);
          const fragContent = editor.schema.text(content);
          const level = markdownSymbols.length - 1;
          const convertedNode = editor.schema.node(
            type.name,
            { level: level },
            [fragContent]
          );
          convertedNodes.push(convertedNode);
        } else {
          convertedNodes.push(child);
        }
      } else {
        console.log("not a textblock");
        convertedNodes.push(child);
      }
    });

    return Fragment.fromArray(convertedNodes);
  };

  return new Plugin({
    key: new PluginKey(`markdownPasteRuleHeading`),
    props: {
      transformPasted: (slice) => {
        console.log(`transforming... slice is ${slice}`);
        return new Slice(
          markdown(slice.content),
          slice.openStart,
          slice.openEnd
        );
      },
    },
  });
};

export default markdownHeadings;
