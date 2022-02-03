import React from "react";
import {
  Editor,
  getMarkRange,
  getMarkType,
  getMarksBetween,
} from "@tiptap/core";
import { CommentComponent } from "./CommentComponent";
import styles from "./Comments.module.css";
import { CommentStore } from "./CommentStore";
import { getNearestComment } from "./GetNearestComment";

export type CommentWrapperProps = {
  editor: Editor;
  commentStore: CommentStore;
};

/**
 * This component is a wrapper for all comments that are displayed at any given time.
 * @param props The component props.
 * @prop editor The editor to render comments for.
 */
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
          props.editor.state.doc
        ).map((mark) => mark.mark.attrs["id"])
      ),
    ];
  }

  const commentDates = new Map();
  commentIds.map((id) =>
    commentDates.set(id, props.commentStore.getComment(id).date)
  );

  // IDs sorted by the chronological order their comments were created in.
  commentIds = Array.from(
    new Map([...commentDates.entries()].sort((a, b) => a[1] - b[1])).keys()
  );

  const highlightedComment = getNearestComment(props.editor.state);

  return (
    <div className={styles.comments} style={{ top: fromTop }}>
      {commentIds.map((id) => (
        <CommentComponent
          commentStore={props.commentStore}
          id={id}
          state={props.editor.state}
          view={props.editor.view}
          key={id}
          highlighted={highlightedComment?.id === id}
        />
      ))}
    </div>
  );
};
