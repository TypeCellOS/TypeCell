import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import uniqueId from "../../../../util/uniqueId";
import { isList } from "../../util/isList";

export interface AutoIdOptions {}

// TODO: tiptap is working on this as well:
// https://github.com/ueberdosis/tiptap/issues/1041
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

          const ids = new Set<string>();
          // Automatically assign ids to nodes that are:
          // - a direct child of the root document
          // - a direct child of a list (e.g.: <ul>, <ol>)

          // We can probably optimize this for performance
          newState.doc.descendants((node, pos, parent) => {
            if (node.isBlock && (parent === newState.doc || isList(parent))) {
              let blockId = node.attrs["block-id"];
              if (ids.has(blockId)) {
                blockId = undefined; // already exists, generate new id
              }
              if (!blockId) {
                blockId = uniqueId();
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  "block-id": blockId,
                });
              }
              ids.add(blockId);
            } else {
              if (node.attrs["block-id"] && parent.type.name !== "ref") {
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
