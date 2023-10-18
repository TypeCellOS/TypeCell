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
  return (state: EditorState, dispatch: any, view: EditorView) => {
    if (state.selection.empty) {
      const side = dir === "left" || dir === "up" ? -1 : 1;
      const $head = state.selection.$head;

      const nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.pos + 1 : $head.pos - 1),
        side,
      );

      if (nextPos.$head && nextPos.$head.parent.type.name === "inlineCode") {
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
export const MonacoInlineCode = createTipTapBlock({
  name: "inlineCode",
  // inline: true,
  content: "inline*",
  editable: true,
  selectable: false,
  parseHTML() {
    return [
      {
        tag: "inlineCode",
        priority: 200,
        node: "inlineCode",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "inlineCode",
      mergeAttributes(HTMLAttributes, {
        // class: styles.blockContent,
        "data-content-type": this.name,
      }),
      0,
    ];
  },

  addNodeView: MonacoNodeView(true),
  addProseMirrorPlugins() {
    return [arrowHandlers] as any;
  },
});

MonacoInlineCode.config.group = "inline" as any;
(MonacoInlineCode as any).config.inline = true as any;

// export function smartBlock(block: any) {
//   const entries = block.children.map((b: any) => {
//     if (!b.content.length) {
//       return undefined;
//     }
//     const props = b.content[0].text.split(":", 2);
//     if (props.length !== 2) {
//       return undefined;
//     }
//     return [props[0].trim(), props[1].trim()];
//   });
//   return Object.fromEntries(entries.filter((a) => !!a));
// }
