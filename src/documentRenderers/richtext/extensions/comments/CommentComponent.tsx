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
import { CommentStorage, CommentType } from "./CommentStorage";
import { navigationStore, sessionStore } from "../../../../store/local/stores";
import styles from "./Comments.module.css";
import avatarImg from "./defualtAvatar.png";
import TextArea from "@atlaskit/textarea";

const commentStorage = new CommentStorage();
const nav = navigationStore;

function getComment(id: number) {
  const comments: Array<CommentType> = commentStorage.getComments();
  return comments.filter((comment) => comment.id === id)[0];
}

export const CommentComponent = (
  id: number,
  state: EditorState,
  view: EditorView
) => {
  // const comment = getComment(id);
  const [commentData, setCommentData] = useState({
    id: 0,
    editable: true,
    comment: "",
    user: "",
    date: "",
  });

  // setCommentData(comment);

  // function updateComment(event: ChangeEvent<HTMLTextAreaElement>) {
  //   event.preventDefault();
  //   comment.comment = event.target.value;
  // }
  //
  // function saveComment() {
  //   const oldComments: Array<CommentType> = commentStorage.getComments();
  //   const newComments = oldComments.filter((comment) => comment.id !== id);
  //   if (commentData.comment !== "") {
  //     comment.editable = false;
  //     newComments.push(commentData);
  //   }
  //   commentStorage.setComments(newComments);
  // }
  //
  // function editComment() {
  //   const oldComments: Array<CommentType> = commentStorage.getComments();
  //   const newComments = oldComments.filter((comment) => comment.id !== id);
  //   comment.editable = true;
  //   newComments.push(commentData);
  //   commentStorage.setComments(newComments);
  // }
  //
  // function cancelEdit() {
  //   if (commentData.comment === "") {
  //     removeComment();
  //   } else {
  //     saveComment();
  //   }
  // }
  //
  // function removeComment() {
  //   // Removes comment from browser cache.
  //   let comments: Array<CommentType> = commentStorage.getComments();
  //   comments = comments.filter((comment) => comment.id !== id);
  //   commentStorage.setComments(comments);
  //
  //   // Removing corresponding comment mark.
  //   const tr = state.tr;
  //   // Iterates over each node.
  //   state.doc.descendants(function (node, offset) {
  //     // Iterates over each mark in node.
  //     for (let mark of node.marks) {
  //       // Checks that mark is of comment type and has the ID that should be removed.
  //       if (mark.attrs["id"] !== null && mark.attrs["id"] === id) {
  //         // Removes comment mark.
  //         const type = getMarkType("comment", state.schema);
  //         const range = getMarkRange(state.doc.resolve(offset), type, {
  //           id: mark.attrs["id"],
  //         });
  //         if (typeof range !== "undefined") {
  //           tr.removeMark(range.from, range.to, mark);
  //           view.dispatch(tr);
  //         }
  //       }
  //     }
  //   });
  //
  //   // Resetting component state.
  //   // setCommentData({
  //   //   id: -1,
  //   //   editable: true,
  //   //   comment: "",
  //   //   user: commentData.user,
  //   //   date: commentData.date,
  //   // });
  // }
  //
  // function getReference() {
  //   const resolvedPos = state.doc.resolve(state.selection.head);
  //   const commentType = getMarkType("comment", state.schema);
  //   const commentRangeWithId = getMarkRange(resolvedPos, commentType, {
  //     id: id,
  //   });
  //   if (typeof commentRangeWithId !== "undefined") {
  //     return state.doc.cut(commentRangeWithId.from, commentRangeWithId.to)
  //       .textContent;
  //   }
  // }

  return (
    <div className={styles.comment} key={Math.random() + ""}>
      {/*<Comment*/}
      {/*  avatar={<Avatar src={avatarImg} size="medium" />}*/}
      {/*  author={<CommentAuthor>{commentData.user}</CommentAuthor>}*/}
      {/*  type={nav.currentPage.owner === commentData.user ? "author" : ""}*/}
      {/*  time={<CommentTime>{commentData.date}</CommentTime>}*/}
      {/*  content={*/}
      {/*    <div>*/}
      {/*      {commentData.editable ? (*/}
      {/*        <div className={styles.commentForm}>*/}
      {/*          <TextArea*/}
      {/*            resize="smart"*/}
      {/*            name="commentInput"*/}
      {/*            defaultValue={commentData.comment}*/}
      {/*            onChange={updateComment}*/}
      {/*          />*/}
      {/*        </div>*/}
      {/*      ) : (*/}
      {/*        <p>{commentData.comment}</p>*/}
      {/*      )}*/}
      {/*      <p className={styles.commentReference}>{getReference()}</p>*/}
      {/*    </div>*/}
      {/*  }*/}
      {/*  actions={*/}
      {/*    commentData.editable*/}
      {/*      ? [*/}
      {/*          <CommentAction onClick={editComment}>Edit</CommentAction>,*/}
      {/*          <CommentAction onClick={removeComment}>Delete</CommentAction>,*/}
      {/*        ]*/}
      {/*      : [*/}
      {/*          <CommentAction onClick={saveComment}>Submit</CommentAction>,*/}
      {/*          <CommentAction onClick={cancelEdit}>Cancel</CommentAction>,*/}
      {/*        ]*/}
      {/*  }*/}
      {/*/>*/}
    </div>
  );
};
