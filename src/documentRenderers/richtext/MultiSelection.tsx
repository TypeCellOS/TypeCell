import { Extension, Node } from "@tiptap/react";
import {
  Plugin,
  PluginKey,
  TextSelection,
  Transaction,
} from "prosemirror-state";
import { NodeRange } from "prosemirror-model";

export const MultiSelection = Extension.create({
  name: "multiSelection",

  defaultOptions: {},
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("MultiSelection"),

        appendTransaction: (transactions, oldState, newState) => {
          const tr = transactions[transactions.length - 1];
          if (tr.selectionSet) {
            console.log(newState.selection.anchor, newState.selection.head);
            // Clears previously selected nodes.
            newState.doc.descendants(function (node, offset) {
              if (node.attrs["block-selected"]) {
                node.attrs["block-selected"] = false;
              }
            });

            // Depth values between resolved positions and node ranges represent different actual depths.
            // 0 1 2 3 4... Actual depths
            // 1 3 5 7 9... ResolvedPos depths
            // 0 1 3 5 7... NodeRange depths

            const anchorDepth =
              newState.selection.$anchor.depth > 1
                ? newState.selection.$anchor.depth - 2
                : 0;

            const headDepth =
              newState.selection.$head.depth > 1
                ? newState.selection.$head.depth - 2
                : 0;

            // Ensures that selection across multiple block depths stays consistent.
            const depth = Math.min(anchorDepth, headDepth);

            // Used to get the start/end positions of the anchor/head nodes of the whole selection.
            const range = new NodeRange(
              newState.selection.$from,
              newState.selection.$to,
              depth
            );

            // Start and end positions of the node the selection anchor is in.
            const nodeStartPos = newState.doc
              .resolve(newState.selection.anchor)
              .start();
            const nodeEndPos = newState.doc
              .resolve(newState.selection.anchor)
              .end();

            // Marks nodes between the anchor and head as selected.
            if (
              (newState.selection.head <= nodeStartPos ||
                newState.selection.head >= nodeEndPos) &&
              newState.selection.head !== newState.selection.anchor
            ) {
              newState.doc.descendants(function (node, offset) {
                // Checks if node lies within selection.
                if (offset >= range.start && offset < range.end - 1) {
                  // These node types are redundant for Notion-like selection.
                  if (
                    node.type.name !== "bulletList" &&
                    node.type.name !== "orderedList" &&
                    node.type.name !== "text"
                  ) {
                    node.attrs["block-selected"] = true;
                  }
                  // Children should not be selected if entire item is selected.
                  if (node.type.name === "listItem") {
                    return false;
                  }
                }
              });
            }
          }
          return;
        },
      }),
    ];
  },
});
