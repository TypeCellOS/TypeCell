import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment, NodeType } from "prosemirror-model";
import { Editor } from "@tiptap/core";

const markdownCodeBlock = (
  editor: Editor,
  regexp: RegExp,
  name: string,
  getAttributes?:
    | Record<string, any>
    | ((match: RegExpExecArray) => Record<string, any>)
): Plugin => {
  const markdown = (fragment: Fragment): Fragment => {
    const convertedNodes: any[] = [];
    const EMPTY = "";
    let texts: string[] = [];
    fragment.forEach((child) => {
      const innerTextBlock = child.firstChild;
      if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text)
        texts.push(innerTextBlock.text);
      else texts.push(EMPTY);
    });

    let accumulatedText: string[] = [];
    const mergeTextsIntoQuote = () => {
      const fragContent = editor.schema.text(accumulatedText.join("\n"));
      const convertedNode = editor.schema.node("codeBlock", {}, [fragContent]);
      convertedNodes.push(convertedNode);
      accumulatedText = [];
    };

    fragment.forEach((child, offset, index) => {
      const rawTextContent = texts[index];
      let match = regexp.exec(rawTextContent);

      // starting with 4 spaces or tab?
      if (match !== null) {
        const markdownSymbols = match[0];
        const textContent = rawTextContent.slice(markdownSymbols.length);
        accumulatedText.push(textContent);
      }

      // ## heaings and other types
      else {
        if (accumulatedText.length > 0) {
          mergeTextsIntoQuote();
        }
        convertedNodes.push(child);
      }
    });

    if (accumulatedText.length > 0) {
      mergeTextsIntoQuote();
    }

    // const convertedNodes: any[] = [];

    // fragment.forEach((child) => {
    //   console.log(`one child of a fragment...`);
    //   const innerTextBlock = child.firstChild;
    //   if (innerTextBlock && innerTextBlock.isText && innerTextBlock.text) {
    //     const text = innerTextBlock.text;
    //     let match = regexp.exec(text);

    //     if (match !== null) {
    //       const markdownSymbols = match[0];
    //       const content = text.slice(markdownSymbols.length);
    //       const fragContent = editor.schema.text(content);
    //       const convertedNode = editor.schema.node("codeBlock", {}, [
    //         fragContent,
    //       ]);
    //       convertedNodes.push(convertedNode);
    //     } else {
    //       convertedNodes.push(child);
    //     }
    //   } else {
    //     convertedNodes.push(child);
    //   }
    // });

    return Fragment.fromArray(convertedNodes);
  };
  return new Plugin({
    key: new PluginKey(`markdownPasteRuleCodeBlock`),
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

export default markdownCodeBlock;
