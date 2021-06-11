import React, { ChangeEvent, useState } from "react";
import { getMarkRange, getMarkType } from "@tiptap/core";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import Avatar from "@atlaskit/avatar";
import Comment, {
  CommentAction,
  CommentAuthor,
  CommentTime,
} from "@atlaskit/comment";
import TextArea from "@atlaskit/textarea";
import { CommentStorage, CommentType } from "./CommentStorage";
import { navigationStore } from "../../../../store/local/stores";
import styles from "./Comments.module.css";
import avatarImg from "./defualtAvatar.png";

const commentStorage = new CommentStorage();
const nav = navigationStore;

export type CommentComponentProps = {
  id: number;
  state: EditorState;
  view: EditorView;
};

/**
 * This component renders a single comment based on comment information that is stored in browser cache.
 * @param props The component props.
 * @prop id     The ID if the comment to render. Used to fetch the appropriate comment data from cache.
 * @prop state  The editor state, used in deletion and finding comment reference text.
 * @prop view   The editor view, used in deletion.
 */
export const CommentComponent: React.FC<CommentComponentProps> = (props) => {
  // commentData is used to store comment changes before writing them to browser cache.
  const [commentData, setCommentData] = useState(getCommentData);

  // Retrieves comment data with the corresponding ID from cache. Returns null if a comment with that ID doesn't exist.
  function getCommentData() {
    const comments: Array<CommentType> = commentStorage.getComments();
    return comments.filter((comment) => comment.id === props.id)[0];
  }

  // Updates comment text from user input but does not save it to cache.
  function updateCommentData(event: ChangeEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    setCommentData({
      id: commentData.id,
      editable: commentData.editable,
      comment: event.target.value,
      user: commentData.user,
      date: commentData.date,
    });
  }

  // Toggles the user's ability to edit a comment. Only updates the "editable" field of the comment in cache.
  function toggleEditable() {
    const oldComments: Array<CommentType> = commentStorage.getComments();
    const newComments = oldComments.filter(
      (comment) => comment.id !== props.id
    );
    const newComment = {
      id: commentData.id,
      editable: !commentData.editable,
      comment: commentData.comment,
      user: commentData.user,
      date: commentData.date,
    };
    newComments.push(newComment);
    commentStorage.setComments(newComments);
    setCommentData(getCommentData);
  }

  // Reverts an editable comment to its previous state. This either deletes it or re-creates it from data in cache.
  function cancelEdit() {
    const oldComments: Array<CommentType> = commentStorage.getComments();
    const newComments = oldComments.filter(
      (comment) => comment.id !== props.id
    );
    // True if comment is only being created rather than edited.
    const remove = getCommentData()!.comment === "";
    const newComment = {
      id: commentData.id,
      editable: false,
      comment: getCommentData().comment,
      user: commentData.user,
      date: commentData.date,
    };
    newComments.push(newComment);
    commentStorage.setComments(newComments);
    // Removes comments if it was being created, reverts it if it was being edited.
    if (remove) {
      removeComment();
    } else {
      setCommentData(getCommentData);
    }
  }

  // Removes the comment from browser cache as well as its corresponding mark.
  function removeComment() {
    // Removes comment from browser cache.
    let comments: Array<CommentType> = commentStorage.getComments();
    comments = comments.filter((comment) => comment.id !== props.id);
    commentStorage.setComments(comments);
    setCommentData(getCommentData);

    // Removes corresponding comment mark.
    const tr = props.state.tr;
    props.state.doc.descendants(function (node, offset) {
      for (let mark of node.marks) {
        if (mark.attrs["id"] !== null && mark.attrs["id"] === props.id) {
          const type = getMarkType("comment", props.state.schema);
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

  // Gets the highlighted text that the comment refers to in the editor.
  function getReference() {
    let reference: string = "";
    const resolvedPos = props.state.doc.resolve(props.state.selection.anchor);
    const commentType = getMarkType("comment", props.state.schema);
    // All comments with marks adjacent/overlapping the one the cursor is in get rendered, so we have to make sure
    // we can get references for these too.
    const commentRange = getMarkRange(resolvedPos, commentType);

    // Checks if cursor is within a comment mark.
    if (typeof commentRange !== "undefined") {
      // Finds the child node the cursor is in which also has comment marks.
      props.state.doc.descendants(function (node, offset) {
        for (let i = 0; i < node.marks.length; i++) {
          // Checks if the mark is a comment in range with the correct ID.
          if (
            offset >= commentRange.from &&
            offset + node.nodeSize <= commentRange.to &&
            node.marks[i].attrs["id"] === props.id
          ) {
            // Finds span of just the mark with the given ID.
            const commentRangeWithId = getMarkRange(
              props.state.doc.resolve(offset),
              commentType,
              {
                id: props.id,
              }
            );
            if (typeof commentRangeWithId !== "undefined") {
              // Gets all text in that span.
              reference = props.state.doc.cut(
                commentRangeWithId.from,
                commentRangeWithId.to
              ).textContent;
            }
          }
        }
      });
    }
    return reference;
  }

  return (
    <div className={styles.comment}>
      <Comment
        avatar={<Avatar src={avatarImg} size="medium" />}
        author={<CommentAuthor>{commentData.user}</CommentAuthor>}
        type={nav.currentPage.owner === commentData.user ? "author" : ""}
        time={<CommentTime>{commentData.date}</CommentTime>}
        content={
          <div>
            {commentData.editable ? (
              <div className={styles.commentForm}>
                <TextArea
                  resize="smart"
                  name="commentInput"
                  defaultValue={getCommentData()!.comment}
                  onChange={updateCommentData}
                />
              </div>
            ) : (
              <p>{commentData.comment}</p>
            )}
            <p className={styles.commentReference}>{getReference()}</p>
          </div>
        }
        actions={
          commentData.editable
            ? [
                <CommentAction
                  isDisabled={commentData!.comment === ""}
                  onClick={toggleEditable}>
                  Submit
                </CommentAction>,
                <CommentAction onClick={cancelEdit}>Cancel</CommentAction>,
              ]
            : [
                <CommentAction onClick={toggleEditable}>Edit</CommentAction>,
                <CommentAction onClick={removeComment}>Delete</CommentAction>,
              ]
        }
      />
    </div>
  );
};
