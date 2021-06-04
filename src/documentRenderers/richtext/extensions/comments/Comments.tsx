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

            console.log(comments);

            // Removes any comments that no longer have corresponding highlighted text in the document.
            comments.forEach(function (value, key) {
              console.log(
                "Key:",
                key,
                "\nType of Key:",
                typeof key,
                "\nMark Ids:",
                markIDs
              );
              if (!markIDs.includes(key)) {
                comments.delete(key);
              }
            });

            // Creates an empty set of decorations.
            let set = DecorationSet.create(state.doc, []);

            // Gets node that the cursor is in. This node does not hold mark information.
            const parent = state.doc.resolve(state.selection.head).node();

            // Finds the child node/s which have comment marks.
            parent.descendants(function (node) {
              if (node.marks.length > 0) {
                for (let mark of node.marks) {
                  if (mark.attrs["id"]) {
                    // Creates a DOM element with comment.
                    const dom = document.createElement("div");
                    dom.innerHTML = comments.get(mark.attrs["id"])!;
                    dom.className = styles.comment;
                    set = set.add(state.doc, [
                      Decoration.widget(state.selection.head, dom),
                    ]);
                  }
                }
              }
            });

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
