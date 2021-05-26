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
          // console.log("TR:", tr, "\nOLD:", oldState, "\nNEW:", newState);
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

              // Creates a new selection which covers the entire nodes the selection goes across.
              const newSelection =
                newState.selection.anchor < newState.selection.head
                  ? TextSelection.create(newState.doc, range.start, range.end)
                  : TextSelection.create(
                      newState.doc,
                      range.end - 1,
                      range.start
                    );

              if (!newSelection.eq(newState.selection)) {
                return newState.tr.setSelection(newSelection);
              }
            }
          }
          return;
        },
      }),
    ];
  },
});
