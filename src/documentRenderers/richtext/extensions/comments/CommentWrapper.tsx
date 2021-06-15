import React from "react";
import {
  Editor,
  getMarkRange,
  getMarkType,
  getMarksBetween,
} from "@tiptap/core";
import { CommentComponent } from "./CommentComponent";
import styles from "./Comments.module.css";

export type CommentWrapperProps = { editor: Editor };

export const CommentWrapper: React.FC<CommentWrapperProps> = (props) => {
  let commentIds: Array<string> = [];
  const commentType = getMarkType("comment", props.editor.state.schema);

  // Range includes all adjacent/overlapping comment marks so that the comments for these are also rendered.
  const commentRange = getMarkRange(
    props.editor.state.selection.$from,
    commentType
  );

  // Positions comments to start at same height as cursor.
  const fromTop =
    props.editor.view.coordsAtPos(props.editor.state.selection.from).top + "px";

  // Finds IDs of all comments to be rendered.
  if (typeof commentRange !== "undefined") {
    commentIds = [
      ...new Set(
        getMarksBetween(
          commentRange.from,
          commentRange.to,
          props.editor.state
        ).map((mark) => mark.mark.attrs["id"])
      ),
    ];
  }

  return (
    <div className={styles.comments} style={{ top: fromTop }}>
      {commentIds.map((id) => (
        <CommentComponent
          id={id}
          state={props.editor.state}
          view={props.editor.view}
          key={id}
        />
      ))}
    </div>
  );
};
