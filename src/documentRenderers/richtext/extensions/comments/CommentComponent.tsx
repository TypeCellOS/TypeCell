import React from "react";
import styles from "./Comments.module.css";
import Flag from "@atlaskit/flag";
import Button from "@atlaskit/button";
import Comment, {
  CommentAction,
  CommentAuthor,
  CommentEdited,
  CommentLayout,
  CommentTime,
} from "@atlaskit/comment";
import Avatar from "@atlaskit/avatar";
import avatarImg from "./defualtAvatar.png";
import { CommentStorage } from "./CommentStorage";
import { navigationStore } from "../../../../store/local/stores";

const commentStorage = new CommentStorage();
const nav = navigationStore;

export const commentComponent = (
  id: number,
  comment: string,
  reference: string
) => {
  function removeComment() {
    const comments = commentStorage.getComments();
    comments.delete(id);
    commentStorage.setComments(comments);
  }

  return (
    <div className={styles.comment}>
      <Comment
        avatar={<Avatar src={avatarImg} size="medium" />}
        author={<CommentAuthor>{nav.currentPage.owner}</CommentAuthor>}
        // type="author"
        // edited={<CommentEdited>Edited</CommentEdited>}
        // restrictedTo="Restricted to Admins Only"
        // time={<CommentTime>30 August, 2016</CommentTime>}
        content={
          <div>
            <p>{comment}</p>
            <p className={styles.commentReference}>{reference}</p>
          </div>
        }
        actions={[
          <CommentAction onClick={removeComment}>Delete</CommentAction>,
        ]}
      />
    </div>
  );
};
