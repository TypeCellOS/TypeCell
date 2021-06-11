import React from "react";
import { Editor, getMarkRange, getMarkType } from "@tiptap/core";
import { CommentComponent } from "./CommentComponent";
import styles from "./Comments.module.css";

export type CommentWrapperProps = { editor: Editor };

export const CommentWrapper: React.FC<CommentWrapperProps> = (props) => {
  const commentIds = new Array<number>();

  // Resolved cursor position.
  const resolvedPos = props.editor.state.doc.resolve(
    props.editor.state.selection.anchor
  );
  const commentType = getMarkType("comment", props.editor.state.schema);
  // Range includes all adjacent/overlapping comment marks so that the comments for these are also rendered.
  const commentRange = getMarkRange(resolvedPos, commentType);

  // Positions comments to start at same height as cursor.
  const fromTop = props.editor.view.coordsAtPos(resolvedPos.pos).top + "px";

  // Checks if cursor is within a comment mark.
  if (typeof commentRange !== "undefined") {
    // Finds the child node the cursor is in which also has comment marks.
    props.editor.state.doc.descendants(function (node, offset) {
      for (let i = 0; i < node.marks.length; i++) {
        if (
          offset >= commentRange.from &&
          offset + node.nodeSize <= commentRange.to &&
          node.marks[i].attrs["id"] !== null &&
          !commentIds.includes(node.marks[i].attrs["id"])
        ) {
          // Creates a React component for the comment and adds it to the list.
          commentIds.push(node.marks[i].attrs["id"]);
        }
      }
    });
  }

  return (
    <div className={styles.comments} style={{ top: fromTop }}>
      {commentIds.map((id) => (
        <CommentComponent
          id={id}
          state={props.editor.state}
          view={props.editor.view}
        />
      ))}
    </div>
  );
};
