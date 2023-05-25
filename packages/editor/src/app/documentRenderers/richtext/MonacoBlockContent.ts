import { createTipTapBlock } from "@blocknote/core";
import { mergeAttributes } from "@tiptap/core";
import * as monaco from "monaco-editor";
// import styles from "../../Block.module.css";

// @ts-ignore
// @ts-ignore
// @ts-ignore
import { Node } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { keymap } from "prosemirror-keymap";
import { Selection, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { MonacoElement } from "./MonacoElement";

function arrowHandler(dir: string) {
  return (state: any, dispatch: any, view: any) => {
    if (state.selection.empty && view.endOfTextblock(dir)) {
      let side = dir == "left" || dir == "up" ? -1 : 1;
      let $head = state.selection.$head;
      let nextPos = Selection.near(
        state.doc.resolve(side > 0 ? $head.after() : $head.before()),
        side
      );
      if (nextPos.$head && nextPos.$head.parent.type.name == "monaco") {
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
});

export function selectionDir(
  view: EditorView,
  pos: number,
  size: number,
  dir: -1 | 1
) {
  const targetPos = pos + (dir < 0 ? 0 : size);
  const selection = Selection.near(view.state.doc.resolve(targetPos), dir);
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  // view.focus();
}

function getTransactionForSelectionUpdate(
  selection: monaco.Selection | null,
  model: monaco.editor.ITextModel | null,
  offset: number,
  tr: Transaction
) {
  if (selection && model) {
    const selFrom = model!.getOffsetAt(selection.getStartPosition()) + offset;
    const selEnd = model!.getOffsetAt(selection.getEndPosition()) + offset;
    tr.setSelection(
      TextSelection.create(
        tr.doc,
        selection.getDirection() === monaco.SelectionDirection.LTR
          ? selFrom
          : selEnd,
        selection.getDirection() === monaco.SelectionDirection.LTR
          ? selEnd
          : selFrom
      )
    );
  }
}

// TODO: clean up listeners
export const MonacoBlockContent = createTipTapBlock({
  name: "monaco",
  content: "inline*",
  editable: true,
  parseHTML() {
    return [
      {
        tag: "p",
        priority: 200,
        node: "paragraph",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: any) {
    return [
      "code",
      mergeAttributes(HTMLAttributes, {
        // class: styles.blockContent,
        "data-content-type": this.name,
      }),
      ["p", 0],
    ];
  },

  addNodeView() {
    let theNode: Node;
    let updating = false;

    return ReactNodeViewRenderer(MonacoElement);

    // return (props) => {
    //   const ret: NodeView = ReactNodeViewRenderer(MonacoElement)(props) as NodeView;

    //   return ret;
    // }
  },
  addProseMirrorPlugins() {
    return [arrowHandlers] as any;
  },
});
