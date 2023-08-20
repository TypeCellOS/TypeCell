import * as monaco from "monaco-editor";
import { Node } from "prosemirror-model";
import { Selection, TextSelection, Transaction } from "prosemirror-state";
import { Decoration, EditorView } from "prosemirror-view";

function selectionDir(
  view: EditorView,
  pos: number,
  size: number,
  dir: -1 | 1
) {
  const targetPos = pos + (dir < 0 ? 0 : size);
  const selection = Selection.near(view.state.doc.resolve(targetPos), dir);
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  view.focus();
}

function getTransactionForSelectionUpdate(
  selection: monaco.Selection | null,
  model: monaco.editor.ITextModel | null,
  offset: number,
  tr: Transaction
) {
  if (selection && model) {
    const selFrom = model.getOffsetAt(selection.getStartPosition()) + offset;
    const selEnd = model.getOffsetAt(selection.getEndPosition()) + offset;
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

// because node.textContent doesn't preserve newlines
export function textFromPMNode(node: Node): string {
  if (!node.isTextblock) {
    throw new Error("not a text node");
  }
  let text = "";
  node.forEach((c) => {
    if (c.type.name === "hardBreak") {
      text += "\n";
    } else if (c.isText) {
      text += c.text;
    } else {
      throw new Error("not a text or hardBreak node");
    }
  });

  return text;
}

export function bindMonacoAndProsemirror(
  mon: monaco.editor.IStandaloneCodeEditor,
  view: EditorView,
  getPos: () => number,
  state: {
    isUpdating: boolean;
    node: Node;
  }
) {
  // const id = Math.random();
  /**
   * When the user selection changes in the monaco editor, we want to make sure the selection in the prosemirror document is updated accordingly.
   */
  mon.onDidChangeCursorSelection((e) => {
    console.log("change selection");

    if (typeof getPos === "boolean") {
      throw new Error("getPos is boolean");
    }

    if (state.isUpdating) {
      return;
    }

    if (!mon.hasTextFocus()) {
      // only update prosemirror selection if the monaco editor actually has focus
      // this makes sure prettier updates on blur don't reset the selection to the code editor
      return;
    }

    const offset = getPos() + 1;

    const tr = view.state.tr;
    getTransactionForSelectionUpdate(
      mon.getSelection(),
      mon.getModel(),
      offset,
      tr
    );
    try {
      view.dispatch(tr);
    } catch (e) {
      console.error(e);
    }
  });

  /**
   * When changes are made by this user to the monaco editor, we want to apply those changes to the prosemirror document.
   */
  mon.onDidChangeModelContent((e) => {
    if (typeof getPos === "boolean") {
      throw new Error("getPos is boolean");
    }

    if (state.isUpdating) {
      return;
    }

    // tmp fix for https://github.com/ProseMirror/prosemirror/issues/1407
    try {
      getPos();
      console.log("getpos succeeded");
    } catch (e) {
      console.log("getpos failed");
      return;
    }

    const offset = getPos() + 1;
    // { main } = update.state.selection;

    const tr = view.state.tr;

    e.changes.forEach((change) => {
      if (change.text.length) {
        tr.replaceWith(
          offset + change.rangeOffset,
          offset + change.rangeOffset + change.rangeLength,
          view.state.schema.text(change.text.toString())
        );
      } else {
        tr.delete(
          offset + change.rangeOffset,
          offset + change.rangeOffset + change.rangeLength
        );
      }
      // TODO: update offset?
    });

    if (mon.hasTextFocus()) {
      // only update prosemirror selection if the monaco editor actually has focus
      // this makes sure prettier updates on blur don't reset the selection to the code editor
      getTransactionForSelectionUpdate(
        mon.getSelection(),
        mon.getModel(),
        offset,
        tr
      );
    }
    try {
      view.dispatch(tr);

      // setTimeout(() => mon.focus(), 1000);
      console.log(mon);
    } catch (e) {
      console.error(e);
    }
  });

  /**
   * When we're at the edges of the monaco editor, and the user hits an arrow key,
   * we might want to move the selection outside of the monaco editor, and into other nodes
   */
  mon.onKeyDown((e) => {
    if (typeof getPos === "boolean") {
      throw new Error("getPos is boolean");
    }

    // delete empty node on backspace
    if (e.code === "Delete" || e.code === "Backspace") {
      if (state.node.textContent === "") {
        view.dispatch(
          view.state.tr.deleteRange(getPos(), getPos() + state.node.nodeSize)
        );
        view.focus();
        return;
      }
    }

    // handle arrow movements
    const { lineNumber = 1, column = 1 } = mon.getPosition() || {};
    const model = mon.getModel();
    const maxLines = model?.getLineCount() || 1;
    let dir: -1 | 1 | null = null;
    if (e.code === "ArrowLeft") {
      if (lineNumber !== 1 || column !== 1) {
        return;
      }
      dir = -1;
    } else if (e.code === "ArrowRight") {
      if (
        lineNumber !== maxLines ||
        column - 1 !== model?.getLineLength(maxLines)
      ) {
        return;
      }
      dir = 1;
    } else if (e.code === "ArrowUp") {
      if (lineNumber !== 1) {
        return;
      }
      dir = -1;
    } else if (e.code === "ArrowDown") {
      if (lineNumber !== maxLines) {
        return;
      }
      dir = 1;
    }
    if (dir !== null) {
      console.log("dir", dir, state.node.nodeSize);
      selectionDir(view, getPos(), state.node.nodeSize, dir);
      return;
    }
  });
}

/**
 * This function takes care of applying changes from the prosemirror document to the monaco editor.
 */
export function applyNodeChangesToMonaco(
  node: Node,
  model: monaco.editor.ITextModel
) {
  const newText = textFromPMNode(node);
  const curText = model.getValue();
  if (newText === curText) {
    return;
  }
  let start = 0,
    curEnd = curText.length,
    newEnd = newText.length;
  while (
    start < curEnd &&
    curText.charCodeAt(start) === newText.charCodeAt(start)
  ) {
    ++start;
  }
  while (
    curEnd > start &&
    newEnd > start &&
    curText.charCodeAt(curEnd - 1) === newText.charCodeAt(newEnd - 1)
  ) {
    curEnd--;
    newEnd--;
  }

  model.applyEdits([
    {
      range: monaco.Range.fromPositions(
        model.getPositionAt(start),
        model.getPositionAt(curEnd)
      ),
      text: newText.slice(start, newEnd),
    },
  ]);
}

/**
 * This function takes care of showing prosemirror decorations (in our case, selections from other users)
 * in the monaco editor.
 *
 * It's similar to this logic from y-monaco: https://github.com/yjs/y-monaco/blob/96a73c6a67daf85f75e8a136bc66c8f29b329ed9/src/y-monaco.js#L88
 */
export function applyDecorationsToMonaco(
  model: monaco.editor.ITextModel,
  decorations: {
    decorations: Decoration[];
    innerDecorations: { local: Decoration[] };
  },
  mon: monaco.editor.IStandaloneCodeEditor,
  lastDecorations: string[],
  headSelectionClassName: string,
  selectionClassName: string
) {
  if (!decorations.innerDecorations) {
    return [];
  }
  const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
  // const decs = (innerDecorations as any).local as Decoration[];

  decorations.innerDecorations.local
    .filter((d) => d.spec.type === "cursor")
    .forEach((cursorDec) => {
      const selectionDec = decorations.innerDecorations.local.find(
        (d) =>
          d.spec.type === "selection" &&
          d.spec.clientID === cursorDec.spec.clientID
      );

      let start: monaco.Position;
      let end: monaco.Position;
      let afterContentClassName: string | undefined;
      let beforeContentClassName: string | undefined;

      const to = cursorDec.to;
      const from = selectionDec
        ? selectionDec.from === to
          ? selectionDec.to
          : selectionDec.from
        : to;

      if (from < to) {
        start = model.getPositionAt(from);
        end = model.getPositionAt(to);
        afterContentClassName =
          headSelectionClassName +
          " " +
          headSelectionClassName +
          "-" +
          cursorDec.spec.clientId;
      } else {
        start = model.getPositionAt(to);
        end = model.getPositionAt(from);
        beforeContentClassName =
          headSelectionClassName +
          " " +
          headSelectionClassName +
          "-" +
          cursorDec.spec.clientId;
      }
      newDecorations.push({
        range: new monaco.Range(
          start.lineNumber,
          start.column,
          end.lineNumber,
          end.column
        ),
        options: {
          className:
            selectionClassName +
            " " +
            selectionClassName +
            "-" +
            cursorDec.spec.clientId,
          afterContentClassName,
          beforeContentClassName,
        },
      });
    });

  return mon.deltaDecorations(lastDecorations, newDecorations);
}
