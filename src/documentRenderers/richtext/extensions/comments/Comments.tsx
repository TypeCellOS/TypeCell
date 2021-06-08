import { Extension } from "@tiptap/react";
import { Plugin, PluginKey, Selection, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import styles from "./Comments.module.css";
import { type } from "os";
import { Editor, getMarkRange, getMarkType, Mark } from "@tiptap/core";

// This plugin adds styling to blocks whenever the selection spans more than one block to indicate they're selected.
export const Comments = Extension.create({
  name: "comments",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("Comments"),

        view: () => {
          return {
            // This pretty much just ensures that comment marks are consistent with the comments in cache.
            // i.e. marks without corresponding comments are removed and vice versa.
            update: (view: EditorView, prevState: EditorState) => {
              let marksRemoved = false;
              if (prevState.doc.textContent === "") {
                return;
              }
              const comments: Map<number, string> = new Map<number, string>(
                JSON.parse(localStorage.getItem("comments")!)
              );

              const markIDs: Array<number> = [];

              // Removes marks with no corresponding comments.
              const tr = prevState.tr;

              // Iterates over each node.
              prevState.doc.descendants(function (node, offset) {
                // Iterates over each mark in node.
                for (let mark of node.marks) {
                  // Checks that mark is of comment type.
                  if (mark.attrs["id"] !== null) {
                    markIDs.push(mark.attrs["id"]);
                    // Checks that mark has no corresponding comment.
                    if (!comments.has(mark.attrs["id"])) {
                      marksRemoved = true;
                      // Removes comment mark.
                      const type = getMarkType("comment", prevState.schema);
                      const range = getMarkRange(
                        prevState.doc.resolve(offset),
                        type
                      );
                      if (typeof range !== "undefined") {
                        tr.removeMark(range.from, range.to, mark);
                      }
                    }
                  }
                }
              });

              // Dispatching a transaction triggers update(), so this stops infinite loops from happening.
              if (marksRemoved) {
                view.dispatch(tr);
              }

              // Removes comments with no corresponding marks.
              comments.forEach(function (value, key) {
                if (!markIDs.includes(key)) {
                  comments.delete(key);
                }
              });

              localStorage.setItem(
                "comments",
                JSON.stringify(Array.from(comments.entries()))
              );
            },
          };
        },

        props: {
          // Shows comments next to the cursor as decorations.
          decorations(state) {
            if (state.doc.textContent === "") {
              return;
            }

            // Gets comments from browser cache and deserializes them into a map.
            const comments: Map<number, string> = new Map<number, string>(
              JSON.parse(localStorage.getItem("comments")!)
            );

            // Creates an empty set of decorations.
            let set = DecorationSet.create(state.doc, []);

            // DOM wrapper for all comments that should be displayed.
            const commentBlock = document.createElement("div");
            commentBlock.className = styles.commentBlock;

            // Resolved cursor position.
            const resolvedPos = state.doc.resolve(state.selection.head);

            // Finds the child node the cursor is in which also has comment marks.
            resolvedPos.node().descendants(function (node, offset) {
              for (let i = 0; i < node.marks.length; i++) {
                if (
                  offset <= state.selection.head - resolvedPos.start() &&
                  state.selection.head - resolvedPos.start() <
                    offset + node.nodeSize &&
                  node.marks[i].attrs["id"] !== null
                ) {
                  // Creates a DOM element with comment inside the wrapper.
                  const comment = document.createElement("p");
                  comment.innerHTML = comments.get(node.marks[i].attrs["id"])!;
                  comment.className = styles.comment;
                  commentBlock.appendChild(comment);

                  const deleteButton = document.createElement("button");
                  deleteButton.innerHTML = "Delete";
                  comment.className = styles.deleteButton;
                  deleteButton.onclick = function () {
                    const id = node.marks[i].attrs["id"];
                    // Gets comments from browser cache and deserializes them into a map.
                    console.log("delete");
                    const newComments: Map<number, string> = new Map<
                      number,
                      string
                    >(JSON.parse(localStorage.getItem("comments")!));
                    newComments.delete(id);
                    localStorage.setItem(
                      "comments",
                      JSON.stringify(Array.from(newComments.entries()))
                    );
                  };

                  comment.appendChild(deleteButton);
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
