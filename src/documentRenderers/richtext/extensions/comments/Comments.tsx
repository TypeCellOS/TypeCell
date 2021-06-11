import { ReactElement } from "react";
import ReactDOM from "react-dom";
import { Extension } from "@tiptap/react";
import { getMarkRange, getMarkType } from "@tiptap/core";
import { Plugin, PluginKey, EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { CommentStorage, CommentType } from "./CommentStorage";
import { CommentComponent } from "./CommentComponent";
import styles from "./Comments.module.css";

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
            update: () => {
              const state = this.editor.state;

              // When refreshing, the editor content doesn't load immediately which would otherwise break things.
              if (state.doc.textContent === "") {
                return;
              }

              let comments: Array<CommentType> = commentStorage.getComments();
              const markIDs: Set<number> = new Set<number>();

              // Fills markIDs array with all comment marks in the document.
              state.doc.descendants(function (node) {
                // Iterates over each mark in node.
                for (let mark of node.marks) {
                  // Checks that mark is of comment type.
                  if (mark.attrs["id"] !== null) {
                    markIDs.add(mark.attrs["id"]);
                  }
                }
              });
              console.log(markIDs);

              // Removes comments with no corresponding marks.
              for (let comment of comments) {
                if (!markIDs.has(comment.id)) {
                  comments = comments.filter((com) => com.id !== comment.id);
                }
              }

              // Saves updated comments to browser cache.
              commentStorage.setComments(comments);
            },
          };
        },
      }),
    ];
  },
});
