import { EditorState } from "prosemirror-state";
import { getMarkRange, getMarksBetween, getMarkType } from "@tiptap/core";

/**
 * This function finds the comment in the editor closest to the cursor. Closest implies that the text the comment refers
 * to has a starting position that is left of the cursor and closer to it than that of any other comment. This seems
 * arbitrary, but it is the same behaviour that's used in most other editors, e.g. Google Docs.
 * @param state	The editor state.
 * @returns			The ID, start position, and end position of the comment nearest to the cursor. Null if the cursor is not
 * 							within text that a comment refer to.
 */
export function getNearestComment(state: EditorState) {
  const commentType = getMarkType("comment", state.schema);
  const commentRange = getMarkRange(state.selection.$from, commentType);

  // Nothing happens if cursor isn't in a comment mark.
  if (typeof commentRange === "undefined") {
    return null;
  }

  // IDs of comment marks which the cursor is in.
  const markIds = new Set(
    getMarksBetween(commentRange.from, commentRange.to, state).map(
      (mark) => mark.mark.attrs["id"]
    )
  );

  // IDs of comment marks which the cursor is in with corresponding start/end positions.
  const markPositions = new Map<string, { from: number; to: number }>();

  // Fills markPositions.
  state.doc.descendants(function (node, offset) {
    for (let mark of node.marks) {
      if (mark.type.name === "comment" && markIds.has(mark.attrs["id"])) {
        if (markPositions.has(mark.attrs["id"])) {
          markPositions.set(mark.attrs["id"], {
            from: markPositions.get(mark.attrs["id"])!.from,
            to: offset + node.nodeSize,
          });
        } else {
          markPositions.set(mark.attrs["id"], {
            from: offset,
            to: offset + node.nodeSize,
          });
        }
      }
    }
  });

  // Range of the comment mark that should be emphasized.
  let id = "";
  let from = -1;
  let to = -1;

  // Finds range of the comment mark with the closest starting position left of the cursor.
  markPositions.forEach(function (range, key) {
    if (
      state.selection.from - range.from >= 0 &&
      state.selection.from - range.from < state.selection.from - from
    ) {
      from = range.from;
      to = range.to;
      id = key;
    }
  });

  return {
    id: id,
    from: from,
    to: to,
  };
}
