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
            // Clears previously selected nodes.
            newState.doc.descendants(function (node) {
              if (node.attrs["block-selected"]) {
                node.attrs["block-selected"] = false;
              }
            });

            // Gets the start/end positions of the anchor/head nodes.
            const range = new NodeRange(
              newState.selection.$from,
              newState.selection.$to,
              0
            );

            // Marks nodes between the anchor and head as selected.
            if (range.endIndex - range.startIndex > 1) {
              newState.doc.nodesBetween(
                range.start,
                range.end,
                function (node, pos) {
                  if (node.attrs["block-id"]) {
                    node.attrs["block-selected"] = true;
                  }
                }
              );

              // FORCES SELECTION TO SPAN BLOCKS - NO PARTIAL SELECTION ACROSS BLOCKS
              // // Creates a new selection which spans the entire blocks the selection goes across.
              // const newSelection =
              //   newState.selection.anchor < newState.selection.head
              //     ? TextSelection.create(newState.doc, range.start, range.end)
              //     : TextSelection.create(
              //         newState.doc,
              //         range.end - 1,
              //         range.start
              //       );
              //
              // // Sets selection to snap to node blocks.
              // if (!newSelection.eq(newState.selection)) {
              //   return newState.tr.setSelection(newSelection);
              // }
            }
          }
          return;
        },
      }),
    ];
  },
});
