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
            // i.e. marks without corresponding comments are removed and vice versa.
            update: (view: EditorView, state: EditorState) => {
              // When refreshing, the editor content doesn't load immediately which would otherwise break things.
              if (state.doc.textContent === "") {
                return;
              }

              let comments: Array<CommentType> = commentStorage.getComments();
              const markIDs: Array<number> = [];

              // Fills markIDs array with all comment marks in the document.
              state.doc.descendants(function (node, offset) {
                // Iterates over each mark in node.
                for (let mark of node.marks) {
                  // Checks that mark is of comment type.
                  if (mark.attrs["id"] !== null) {
                    markIDs.push(mark.attrs["id"]);
                  }
                }
              });

              // Removes comments with no corresponding marks.
              for (let comment of comments) {
                if (!markIDs.includes(comment.id)) {
                  comments = comments.filter((com) => com.id !== comment.id);
                }
              }

              // Saves updated comments to browser cache.
              commentStorage.setComments(comments);

              // Wrapper element for displayed comments.
              const commentWrapper: HTMLElement =
                document.getElementsByClassName(
                  styles.comments
                )[0]! as HTMLElement;

              // Removes all displayed comments from inside the wrapper.
              ReactDOM.unmountComponentAtNode(commentWrapper);

              // New list of comments to be displayed in the wrapper.
              const commentElements: Array<JSX.Element> = [];

              // Resolved cursor position.
              const resolvedPos = state.doc.resolve(state.selection.head);
              const commentType = getMarkType("comment", state.schema);
              // Range includes all adjacent/overlapping comments so comments for these are also rendered.
              const commentRange = getMarkRange(resolvedPos, commentType);

              // Positions comments to start at same height as cursor.
              commentWrapper.style.top =
                view.coordsAtPos(resolvedPos.pos).top + "px";

              // Checks if cursor is within a comment mark.
              if (typeof commentRange !== "undefined") {
                // Finds the child node the cursor is in which also has comment marks.
                state.doc.descendants(function (node, offset) {
                  for (let i = 0; i < node.marks.length; i++) {
                    if (
                      offset >= commentRange.from &&
                      offset + node.nodeSize <= commentRange.to &&
                      node.marks[i].attrs["id"] !== null
                    ) {
                      // Creates a React component for the comment and adds it to the list.
                      commentElements.push(
                        <CommentComponent
                          id={node.marks[i].attrs["id"]}
                          state={state}
                          view={view}
                        />
                      );
                    }
                  }
                });
              }

              // Renders comments inside the comment wrapper.
              ReactDOM.render(commentElements, commentWrapper);
            },
          };
        },
      }),
    ];
  },
});
