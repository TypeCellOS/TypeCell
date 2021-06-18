import { EditorState } from "prosemirror-state";
import { getMarkRange, getMarksBetween, getMarkType } from "@tiptap/core";

/**
 * There is a faster, but much more complicated way of doing this, something like this:
 * 1. Create a list with the IDs of all comment marks that selection.from is in.
 * 2. Find the TextNode that selection.from is in.
 * 3. Perform a depth-first search on the document, starting at the text node found in step 2 and heading towards the
 * start of the document.
 * 4. Treat TextNodes as leaf nodes.
 * 5. Search the tree until a leaf node no longer contains comment marks with all the IDs in the list.
 * 6. Save the ID of the first comment mark which is missing from this leaf node and the node start position.
 * 7. Perform a new depth-first search, again starting at the leaf node from step 2 but now heading towards the end of
 * the document.
 * 8. When a leaf node no longer has a comment mark with the saved ID, save the node start position - 1.
 */

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
