import Avatar from "@atlaskit/avatar";
import Comment, {
  CommentAction,
  CommentAuthor,
  CommentTime,
} from "@atlaskit/comment";
import TextArea from "@atlaskit/textarea";
import { getMarkRange, getMarkType } from "@tiptap/core";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React, { ChangeEvent, useState } from "react";
import { navigationStore } from "../../../../store/local/stores";
import styles from "./Comments.module.css";
import { commentStore } from "./CommentStore";
import avatarImg from "./defualtAvatar.png";

export type CommentComponentProps = {
  id: string;
  state: EditorState;
  view: EditorView;
  highlighted: boolean;
};

/**
 * This component renders a single comment based on comment information that is stored in browser cache.
 * @param props The component props.
 * @prop id     The ID if the comment to render. Used to fetch the appropriate comment data from cache.
 * @prop state  The editor state, used in deletion.
 * @prop view   The editor view, used in deletion.
 */
export const CommentComponent: React.FC<CommentComponentProps> = (props) => {
  const [comment, setComment] = useState(
    commentStore.getComment(props.id).comment
  );
  const [editing, setEditing] = useState(
    commentStore.getComment(props.id).comment === ""
  );

  // Updates comment text from user input but does not save it to cache.
  function updateComment(event: ChangeEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    setComment(event.target.value);
  }

  // Toggles the user's ability to edit a comment. Only updates the "editable" field of the comment in cache.
  function toggleEditing() {
    setEditing(!editing);
    if (editing) {
      // was editing, but now submits
      commentStore.updateComment(props.id, comment);
    }
  }

  // Reverts an editable comment to its previous state. This either deletes it or re-creates it from data in cache.
  function cancelEdit(e: React.MouseEvent) {
    // True if comment is only being created rather than edited.
    const remove = commentStore.getComment(props.id).comment === "";
    // Removes comment if it was being created, reverts it if it was being edited.
    if (remove) {
      markCommentAsResolvedAndRemoveMark();
    } else {
      setComment(commentStore.getComment(props.id).comment);
      setEditing(false);
    }
    e.stopPropagation();
  }

  function resolveComment(e: React.MouseEvent) {
    markCommentAsResolvedAndRemoveMark();
    e.stopPropagation();
  }

  // Removes the comment from browser cache as well as its corresponding mark.
  function markCommentAsResolvedAndRemoveMark() {
    // Removes comment from browser cache.
    commentStore.resolveComment(props.id);
    // Removes corresponding comment mark.
    const tr = props.state.tr;
    props.state.doc.descendants(function (node, offset) {
      for (let mark of node.marks) {
        if (mark.type.name === "comment" && mark.attrs["id"] === props.id) {
          const type = getMarkType(mark.type.name, props.state.schema);
          const range = getMarkRange(props.state.doc.resolve(offset), type, {
            id: mark.attrs["id"],
          });
          if (typeof range !== "undefined") {
            tr.removeMark(range.from, range.to, mark);
          }
        }
      }
    });
    props.view.dispatch(tr);
  }

  function highlight() {
    const tr = props.state.tr;
    let commentFound = false;
    props.state.doc.descendants(function (node, offset) {
      for (let mark of node.marks) {
        if (commentFound) {
          return false;
        }
        if (mark.type.name === "comment" && mark.attrs["id"] === props.id) {
          commentFound = true;
          tr.setSelection(TextSelection.create(props.state.doc, offset));
          props.view.dispatch(tr);
        }
      }
    });
  }

  return (
    <div
      className={styles.comment}
      style={{ background: props.highlighted ? "#FFF0B3" : "white" }}
      onClick={highlight}>
      <Comment
        avatar={<Avatar src={avatarImg} size="medium" />}
        author={
          <CommentAuthor>
            {commentStore.getComment(props.id).user}
          </CommentAuthor>
        }
        type={
          navigationStore.currentPage.owner ===
          commentStore.getComment(props.id).user
            ? "author"
            : ""
        }
        time={
          <CommentTime>
            {new Date(
              commentStore.getComment(props.id).date
            ).toLocaleDateString()}
          </CommentTime>
        }
        content={
          <div>
            {editing ? (
              <div className={styles.commentForm}>
                <TextArea
                  resize="smart"
                  name="commentInput"
                  defaultValue={commentStore.getComment(props.id).comment}
                  onChange={updateComment}
                />
              </div>
            ) : (
              <p>{comment}</p>
            )}
          </div>
        }
        actions={
          editing
            ? [
                <CommentAction
                  isDisabled={comment === ""}
                  onClick={toggleEditing}>
                  Submit
                </CommentAction>,
                <CommentAction onClick={cancelEdit}>Cancel</CommentAction>,
              ]
            : navigationStore.currentPage.owner ===
              commentStore.getComment(props.id).user
            ? [
                <CommentAction onClick={toggleEditing}>Edit</CommentAction>,
                <CommentAction onClick={resolveComment}>Resolve</CommentAction>,
              ]
            : []
        }
      />
    </div>
  );
};
