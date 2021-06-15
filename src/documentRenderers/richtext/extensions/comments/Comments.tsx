import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { commentStore, CommentType } from "./CommentStore";
import { getMarkRange, getMarksBetween, getMarkType } from "@tiptap/core";

// This plugin removes comments when their marks are deleted and handles how comment marks get extended.
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

              // WIP
              // const commentType = getMarkType("comment", state.schema);
              // const commentRange = getMarkRange(
              //   state.selection.$from,
              //   commentType
              // );
              //
              // if (typeof commentRange !== "undefined") {
              //   const marks = getMarksBetween(
              //     commentRange.from,
              //     commentRange.to,
              //     state
              //   ).filter((mark) => state.selection.from - mark.from >= 0);
              //
              //   const uniqueIds = [
              //     ...new Set(marks.map((mark) => mark.mark.attrs["id"])),
              //   ];
              //
              //   const combinedMarks = [];
              //
              //   for (let id of uniqueIds) {
              //     const from: number = Math.min(
              //       ...marks
              //         .filter((mark) => mark.mark.attrs["id"] === id)
              //         .map((mark) => mark.from)
              //     );
              //     const to: number = Math.max(
              //       ...marks
              //         .filter((mark) => mark.mark.attrs["id"] === id)
              //         .map((mark) => mark.to)
              //     );
              //     combinedMarks.push({
              //       id: id,
              //       from: from,
              //       to: to,
              //     });
              //   }
              //
              //   console.log(marks);
              //   console.log(state.selection.from);
              // }

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
