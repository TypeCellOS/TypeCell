import { Plugin, PluginKey } from "prosemirror-state";
import { Slice, Fragment } from "prosemirror-model";
import { Editor } from "@tiptap/core";

const multipleLineMarkdownRuleBuilder = (
  pluginKey: string,
  mergeTextsIntoQuote: (editor: Editor, accumulatedText: string[]) => any
) => {
  return (editor: Editor, regexp: RegExp) => {
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
      // const mergeTextsIntoQuote = () => {
      //   const fragContent = editor.schema.text(accumulatedText.join("\n"));
      //   const convertedNode = editor.schema.node("codeBlock", {}, [fragContent]);
      //   convertedNodes.push(convertedNode);
      //   accumulatedText = [];
      // };

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
            const newNode = mergeTextsIntoQuote(editor, accumulatedText);
            accumulatedText = [];
            convertedNodes.push(newNode);
          }
          convertedNodes.push(child);
        }
      });

      if (accumulatedText.length > 0) {
        const newNode = mergeTextsIntoQuote(editor, accumulatedText);
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
