import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import styles from "./Comments.module.css";
import { type } from "os";

// This plugin adds styling to blocks whenever the selection spans more than one block to indicate they're selected.
export const Comments = Extension.create({
  name: "comments",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("Comments"),

        props: {
          decorations(state) {
            if (state.doc.textContent === "") {
              return;
            }

            // Gets comments from browser cache and deserializes them into a map.
            const comments: Map<number, string> = new Map<number, string>(
              JSON.parse(localStorage.getItem("comments")!)
            );

            // Stores IDs of comment marks (highlighted text that comments refer to).
            const markIDs: Array<number> = [];

            // Fills markIDs array.
            state.doc.descendants(function (node) {
              if (node.marks.length > 0) {
                for (let mark of node.marks) {
                  if (mark.attrs["id"] !== null) {
                    markIDs.push(mark.attrs["id"]);
                  }
                }
              }
            });

            // Removes any comments that no longer have corresponding highlighted text in the document.
            comments.forEach(function (value, key) {
              if (!markIDs.includes(key)) {
                comments.delete(key);
              }
            });

            // Creates an empty set of decorations.
            let set = DecorationSet.create(state.doc, []);

            // DOM wrapper for all comments that should be displayed.
            const commentBlock = document.createElement("div");
            commentBlock.className = styles.commentBlock;

            // Resolved cursor position.
            const resolvedPos = state.doc.resolve(state.selection.head);

            // Finds the child node the cursor is in which also has comment marks.
            resolvedPos.node().descendants(function (node, offset) {
              for (let mark of node.marks.filter(
                (mark) => mark.attrs["id"] !== null
              )) {
                console.log(
                  "Node:",
                  node,
                  "\nStart:",
                  offset,
                  "\nEnd:",
                  offset + node.nodeSize,
                  "\n Cursor:",
                  state.selection.head,
                  "\n Parent Start:",
                  state.doc.resolve(state.selection.head).start()
                );
                if (
                  offset <= state.selection.head - resolvedPos.start() &&
                  state.selection.head - resolvedPos.start() <=
                    offset + node.nodeSize
                ) {
                  // Creates a DOM element with comment inside the wrapper.
                  const comment = document.createElement("p");
                  comment.innerHTML = comments.get(mark.attrs["id"])!;
                  comment.className = styles.comment;
                  commentBlock.appendChild(comment);
                }
              }
            });

            // Creates widget with all comments to render.
            set = set.add(state.doc, [
              Decoration.widget(
                state.doc.resolve(state.selection.head).before(),
                commentBlock
              ),
            ]);

            // Serializes the updated comments and saves them in browser cache.
            localStorage.setItem(
              "comments",
              JSON.stringify(Array.from(comments.entries()))
            );

            return set;
          },
        },
      }),
    ];
  },
});
