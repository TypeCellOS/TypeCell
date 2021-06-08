import React from "react";
import styles from "./Comments.module.css";

export const commentComponent = (id: number, comment: string) => {
  function removeComment() {
    // Gets comments from browser cache and deserializes them into a map.
    const newComments: Map<number, string> = new Map<number, string>(
      JSON.parse(localStorage.getItem("comments")!)
    );
    newComments.delete(id);
    localStorage.setItem(
      "comments",
      JSON.stringify(Array.from(newComments.entries()))
    );
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
