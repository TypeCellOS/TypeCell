import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { forSelectedBlocks } from "./forSelectedBlocks";
import styles from "../extensions/blocktypes/Block.module.css";

// This plugin adds styling to blocks whenever the selection spans more than one block to indicate they're selected.
export const MultiSelection = Extension.create({
  name: "multiSelection",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("MultiSelection"),

        props: {
          decorations(state) {
            // Creates an empty set of decorations.
            let set = DecorationSet.create(state.doc, []);

            // Function that adds "selected" styling for a given node.
            function setSelectionDecorations(node: Node, offset?: number) {
              if (offset !== undefined) {
                set = set.add(state.doc, [
                  Decoration.node(offset, offset + node.nodeSize, {
                    class: styles.selected,
                  }),
                ]);
              }
            }

            // Runs setSelectionDecorations for all selected blocks.
            forSelectedBlocks(state, setSelectionDecorations);

            return set;
          },
        },
      }),
    ];
  },
});
