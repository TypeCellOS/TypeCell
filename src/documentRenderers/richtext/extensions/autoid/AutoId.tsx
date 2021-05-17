import { Extension, Node } from "@tiptap/react";
import { uniqueId } from "lodash";
import { Plugin, PluginKey } from "prosemirror-state";
import { isList } from "../../util/isList";

export interface AutoIdOptions {}

export const AutoId = Extension.create<AutoIdOptions>({
  name: "autoId",

  defaultOptions: {},
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("AutoId"),

        appendTransaction: (transactions, oldState, newState) => {
          if (newState.doc === oldState.doc) {
            // no changes
            return;
          }
          const tr = newState.tr;

          // Automatically assign ids to nodes that are:
          // - a direct child of the root document
          // - a direct child of a list (e.g.: <ul>, <ol>)

          // We can probably optimize this for performance
          newState.doc.descendants((node, pos, parent) => {
            if (node.isBlock && (parent === newState.doc || isList(parent))) {
              if (!node.attrs["block-id"]) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  "block-id": uniqueId(),
                });
              }
            } else {
              // remove id
              if (node.attrs["block-id"]) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  "block-id": undefined,
                });
              }
            }
          });
          return tr;
        },
      }),
    ];
  },
});
