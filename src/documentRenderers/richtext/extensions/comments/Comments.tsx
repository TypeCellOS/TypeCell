import { Extension } from "@tiptap/react";
import { Plugin, PluginKey, Selection, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import styles from "./Comments.module.css";
import { type } from "os";
import { Editor, getMarkRange, getMarkType, Mark } from "@tiptap/core";
import ReactDOM from "react-dom";
import { CommentStorage } from "./CommentStorage";
import { commentComponent } from "./CommentComponent";

const commentStorage = new CommentStorage();

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
              // When refreshing, the editor content doesn't load immediately which would otherwise break things.
              if (prevState.doc.textContent === "") {
                return;
              }

              const comments = commentStorage.getComments();
              const markIDs: Array<number> = [];

              let marksRemoved = false;

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

              commentStorage.setComments(comments);
            },
          };
        },

        props: {
          // Shows comments next to the cursor as decorations.
          decorations(state) {
            // Gets comments from browser cache.
            const comments = commentStorage.getComments();

            // Creates an empty set of decorations.
            let set = DecorationSet.create(state.doc, []);

            // Wrapper for all comments that should be displayed.
            const commentBlock = document.createElement("div");
            commentBlock.className = styles.commentBlock;

            // List of comment React components.
            const commentElements: Array<JSX.Element> = [];

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
                  // Creates a React component for the comment and adds it to the list.
                  commentElements.push(
                    commentComponent(
                      node.marks[i].attrs["id"],
                      comments.get(node.marks[i].attrs["id"])!
                    )
                  );
                }
              }
            });

            // Converts React components into DOM elements inside the wrapper.
            ReactDOM.render(commentElements, commentBlock);

            // Creates widget with all comments to render.
            set = set.add(state.doc, [
              Decoration.widget(
                state.doc.resolve(state.selection.head).before(),
                commentBlock
              ),
            ]);

            // Saves updated comments to browser cache.
            commentStorage.setComments(comments);

            return set;
          },
        },
      }),
    ];
  },
});
