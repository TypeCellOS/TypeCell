import React from "react";
import styles from "./Comments.module.css";
import { CommentStorage } from "./CommentStorage";

const commentStorage = new CommentStorage();

export const commentComponent = (id: number, comment: string) => {
  function removeComment() {
    const comments = commentStorage.getComments();
    comments.delete(id);
    commentStorage.setComments(comments);
  }

  return (
    <div>
      <p className={styles.comment}>{comment}</p>
      <button className={styles.deleteButton} onClick={removeComment}>
        Delete
      </button>
    </div>
  );
};
