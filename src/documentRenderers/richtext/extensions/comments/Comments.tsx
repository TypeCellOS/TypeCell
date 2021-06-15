import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { commentStore, CommentType } from "./CommentStore";

// This plugin ensures that comment marks are consistent with the comments in cache.
export const Comments = Extension.create({
  name: "comments",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("Comments"),

        view: () => {
          return {
            update: () => {
              const state = this.editor.state;

              // When refreshing, the editor content doesn't load immediately which would otherwise break things.
              if (state.doc.textContent === "") {
                return;
              }

              let comments: Array<CommentType> = commentStore.getComments();
              const markIDs: Set<string> = new Set<string>();

              // Fills markIDs array with all comment marks in the document.
              state.doc.descendants(function (node) {
                // Iterates over each mark in node.
                for (let mark of node.marks) {
                  // Checks that mark is of comment type.
                  if (mark.type.name === "comment") {
                    markIDs.add(mark.attrs["id"]);
                  }
                }
              });

              // Removes comments with no corresponding marks.
              comments = comments.filter((comment) => markIDs.has(comment.id));

              // Saves updated comments to browser cache.
              commentStore.setComments(comments);
            },
          };
        },
      }),
    ];
  },
});
