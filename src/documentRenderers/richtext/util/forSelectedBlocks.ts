import { EditorState } from "prosemirror-state";
import { Node, NodeRange } from "prosemirror-model";

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
  // Depth values between resolved positions and node ranges represent different actual depths.
  // 0 1 2 3 4... Actual depths
  // 1 3 5 7 9... ResolvedPos depths
  // 0 1 3 5 7... NodeRange depths

  const anchorDepth =
    state.selection.$anchor.depth > 1 ? state.selection.$anchor.depth - 2 : 0;

  const headDepth =
    state.selection.$head.depth > 1 ? state.selection.$head.depth - 2 : 0;

  // Ensures that selection across multiple block depths stays consistent.
  const depth = Math.min(anchorDepth, headDepth);

  // Used to get the start/end positions of the anchor/head nodes of the whole selection.
  const range = new NodeRange(
    state.selection.$from,
    state.selection.$to,
    depth
  );

  // Start and end positions of the node the selection anchor is in.
  const nodeStartPos = state.doc.resolve(state.selection.anchor).start();
  const nodeEndPos = state.doc.resolve(state.selection.anchor).end();

  // Marks nodes between the anchor and head as selected.
  if (
    (state.selection.head <= nodeStartPos ||
      state.selection.head >= nodeEndPos) &&
    state.selection.head !== state.selection.anchor
  ) {
    state.doc.descendants(function (node, offset) {
      // Checks if node lies within selection.
      if (offset >= range.start && offset < range.end - 1) {
        // These node types are redundant for Notion-like selection.
        if (
          node.type.name !== "bulletList" &&
          node.type.name !== "orderedList" &&
          node.type.name !== "text"
        ) {
          f(node, offset);
        }
        // Children should not be selected if entire item is selected.
        if (node.type.name === "listItem") {
          return false;
        }
      }
    });
  }
}
