import React, { ChangeEvent, useState } from "react";
import { getMarkRange, getMarksBetween, getMarkType } from "@tiptap/core";
import { EditorState, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import Avatar from "@atlaskit/avatar";
import Comment, {
  CommentAction,
  CommentAuthor,
  CommentTime,
} from "@atlaskit/comment";
import TextArea from "@atlaskit/textarea";
import { commentStore, CommentType } from "./CommentStore";
import { navigationStore } from "../../../../store/local/stores";
import styles from "./Comments.module.css";
import avatarImg from "./defualtAvatar.png";
import { getNearestComment } from "./GetNearestComment";

export type CommentComponentProps = {
  id: string;
  state: EditorState;
  view: EditorView;
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
  const [commentEditable, setCommentEditable] = useState(
    commentStore.getComment(props.id).comment === ""
  );

  // Updates comment text from user input but does not save it to cache.
  function updateComment(event: ChangeEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    setComment(event.target.value);
  }

  // Toggles the user's ability to edit a comment. Only updates the "editable" field of the comment in cache.
  function toggleEditable() {
    setCommentEditable(!commentEditable);
    const oldComments: Array<CommentType> = commentStore.getComments();
    const newComments = oldComments.filter(
      (comment) => comment.id !== props.id
    );
    const newComment = {
      id: commentStore.getComment(props.id).id,
      comment: comment,
      user: commentStore.getComment(props.id).user,
      date: commentStore.getComment(props.id).date,
    };
    newComments.push(newComment);
    commentStore.setComments(newComments);
  }

  // Reverts an editable comment to its previous state. This either deletes it or re-creates it from data in cache.
  function cancelEdit() {
    // True if comment is only being created rather than edited.
    const remove = commentStore.getComment(props.id).comment === "";
    // Removes comment if it was being created, reverts it if it was being edited.
    if (remove) {
      removeComment();
    } else {
      setComment(commentStore.getComment(props.id).comment);
      setCommentEditable(false);
    }
  }

  // Removes the comment from browser cache as well as its corresponding mark.
  function removeComment() {
    // Removes comment from browser cache.
    let comments: Array<CommentType> = commentStore.getComments();
    comments = comments.filter((comment) => comment.id !== props.id);
    commentStore.setComments(comments);

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

  // Checks if this comment is closest to the cursor.
  function checkHighlighted() {
    return getNearestComment(props.state)?.id === props.id;
  }

  function highlight() {
    const tr = props.state.tr;
    let commentFound = false;
    props.state.doc.descendants(function (node, offset) {
      for (let mark of node.marks) {
        if (!commentFound) {
          if (mark.type.name === "comment" && mark.attrs["id"] === props.id) {
            commentFound = true;
            tr.setSelection(TextSelection.create(props.state.doc, offset));
            props.view.dispatch(tr);
          }
        } else {
          return false;
        }
      }
    });
  }

  return (
    <div
      className={styles.comment}
      style={{ background: checkHighlighted() ? "#FFF0B3" : "white" }}
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
            {commentEditable ? (
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
          commentEditable
            ? [
                <CommentAction
                  isDisabled={comment === ""}
                  onClick={toggleEditable}>
                  Submit
                </CommentAction>,
                <CommentAction onClick={cancelEdit}>Cancel</CommentAction>,
              ]
            : navigationStore.currentPage.owner ===
              commentStore.getComment(props.id).user
            ? [
                <CommentAction onClick={toggleEditable}>Edit</CommentAction>,
                <CommentAction onClick={removeComment}>Delete</CommentAction>,
              ]
            : []
        }
      />
    </div>
  );
};
