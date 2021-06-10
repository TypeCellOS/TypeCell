import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node } from "prosemirror-model";
import styles from "../extensions/blocktypes/Block.module.css";

export const HideBlocks = Extension.create({
  name: "hideBlocks",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("HideBlocks"),

        props: {
          decorations(state) {
            // Creates an empty set of decorations.
            // TODO: I expect that this would only allow for one toggle block to be hidden at a time, TEST!
            let set = DecorationSet.create(state.doc, []);
            function setToggledDecorations(node: Node, offset?: number) {
              if (offset !== undefined) {
                set = set.add(state.doc, [
                  Decoration.node(offset, offset + node.nodeSize, {
                    class: styles.hiddenToggledBlock,
                  }),
                ]);
              }
            }
            state.doc.descendants(function (node, offset, parent) {
              // debugger;
              if (
                // parent.type.name == "listItem" &&
                node.attrs["is-toggled"]
                // node.inlineContent == false
              ) {
                debugger;
                setToggledDecorations(node, offset);
              }
            });

            return set;
          },
        },
      }),
    ];
  },
});
