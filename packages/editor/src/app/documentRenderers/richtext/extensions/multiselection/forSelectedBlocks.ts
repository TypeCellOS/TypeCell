import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { isList } from "../../util/isList";

/**
 * This function runs f on every node that's in the current multi-block selection. It is mainly used to update block
 * styling every time the selection changes as well as get the selected nodes for drag/drop & deletion functionality.
 * @param state The editor state, used to retrieve the current selection.
 * @param f     The function to run on each node in the multi-block selection.
 */
export function forSelectedBlocks(
  state: EditorState,
  f: (node: Node, offset?: number) => void
) {
  // No point checking for selected blocks if the selection only covers a single position.
  if (state.selection.head === state.selection.anchor) {
    return;
  }

  // Start and end positions of the node the selection anchor is in.
  const nodeStartPos = state.doc.resolve(state.selection.anchor).start();
  const nodeEndPos = state.doc.resolve(state.selection.anchor).end();

  // No point checking for selected blocks if the selection lies within a single block.
  if (
    state.selection.head >= nodeStartPos &&
    state.selection.head < nodeEndPos
  ) {
    return;
  }

  // This code is currently redundant, but may be useful if the implementation of lists is re-evaluated.
  //
  // Depth values between resolved positions and node ranges represent different actual depths.
  // 0 1 2 3 4... Actual depths
  // 1 3 5 7 9... ResolvedPos depths
  // 0 1 3 5 7... NodeRange depths
  //
  // const anchorDepth =
  //   state.selection.$anchor.depth > 1 ? state.selection.$anchor.depth - 2 : 0;
  //
  // const headDepth =
  //   state.selection.$head.depth > 1 ? state.selection.$head.depth - 2 : 0;
  //
  // // Ensures that selection across multiple block depths stays consistent.
  // const depth = Math.min(anchorDepth, headDepth);
  //
  // // Used to get the start/end positions of the anchor/head nodes of the whole selection.
  // const range = new NodeRange(
  //   state.selection.$from,
  //   state.selection.$to,
  //   depth
  // );

  // Stops the children of a list item from being selected if the list item itself is already selected.
  let listItemSelected = false;

  // Marks nodes between the anchor and head as selected.
  state.doc.descendants(function (node, offset, parent) {
    // Checks if node lies within selection.
    if (
      (offset >= state.selection.from && offset < state.selection.to) ||
      (offset + node.nodeSize >= state.selection.from &&
        offset + node.nodeSize < state.selection.to)
    ) {
      // If a list item's text is selected along with its sub-list items, the whole list item is selected. This is done
      // to make the UX more intuitive.
      if (
        node.type.name === "paragraph" &&
        parent.type.name === "listItem" &&
        !listItemSelected
      ) {
        f(parent, offset - 1);
        listItemSelected = true;
      }
      // List and text nodes cannot be selected as doing so would cause duplication (e.g. if both a list and the items
      // in it could be selected, each list item would be selected twice).
      if (!isList(node) && node.type.name !== "text" && !listItemSelected) {
        f(node, offset);
        return false; // If a parent node is selected, children are not to prevent duplication.
      }
    }
  });
}
