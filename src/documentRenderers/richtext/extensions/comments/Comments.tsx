import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { getNearestComment } from "./GetNearestComment";

// General extension to aid user experience with comments.
export const Comments = Extension.create({
  name: "comments",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("Comments"),

        // Emphasizes highlight of the mark of the nearest comment if the cursor is within a comment mark.
        props: {
          decorations(state) {
            const nearestComment = getNearestComment(state);

            if (nearestComment == null) {
              return;
            }

            return DecorationSet.create(state.doc, [
              Decoration.inline(nearestComment.from, nearestComment.to, {
                style: "background-color: #FFC400",
              }),
            ]);
          },
        },
      }),
    ];
  },
});
