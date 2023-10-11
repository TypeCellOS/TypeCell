/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTipTapBlock } from "@blocknote/core";
import { mergeAttributes } from "@tiptap/core";
// import styles from "../../Block.module.css";

import { keymap } from "prosemirror-keymap";
import { EditorState, Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { MonacoNodeView } from "./MonacoNodeView";

function arrowHandler(
  dir: "up" | "down" | "left" | "right" | "forward" | "backward",
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (state: EditorState, dispatch: any, view: EditorView) => {
    if (state.selection.empty && view.endOfTextblock(dir)) {
      const side = dir === "left" || dir === "up" ? -1 : 1;
      const $head = state.selection.$head;
      const nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.after() : $head.before()),
        side,
      );
      // console.log("nextPos", nextPos.$head.parent.type.name);
      if (nextPos.$head && nextPos.$head.parent.type.name === "codeblock") {
        dispatch(state.tr.setSelection(nextPos));
        return true;
      }
    }
    return false;
  };
}

const arrowHandlers = keymap({
  ArrowLeft: arrowHandler("left"),
  ArrowRight: arrowHandler("right"),
  ArrowUp: arrowHandler("up"),
  ArrowDown: arrowHandler("down"),
} as any);

// TODO: clean up listeners
export const MonacoCodeBlock = createTipTapBlock<"codeblock", any>({
  name: "codeblock",
  content: "inline*",
  editable: true,
  selectable: true,
  whitespace: "pre",
  code: true,
  addAttributes() {
    return {
      language: {
        default: "typescript",
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => {
          return {
            "data-language": attributes.language,
          };
        },
      },
      storage: {
        default: {},
        parseHTML: (_element) => ({}),
        renderHTML: (attributes) => {
          return {
            // "data-language": attributes.language,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "code",
        priority: 200,
        node: "codeblock",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "code",
      mergeAttributes(HTMLAttributes, {
        // class: styles.blockContent,
        "data-content-type": this.name,
      }),
    ];
  },

  addNodeView: MonacoNodeView(false),
  addProseMirrorPlugins() {
    return [arrowHandlers];
  },
});
