import { v4 } from "uuid";
import { sessionStore } from "../../../../store/local/stores";

export type CommentType = {
  id: string;
  comment: string;
  user: string;
  date: number;
};

// This class provides commands to easily manipulate and retrieve comment data in browser cache.
class CommentStore {
  // Creates a new array to store comments in browser cache, serialized into JSON.
  public initialize() {
    localStorage.setItem("comments", JSON.stringify(new Array<CommentType>()));
  }

  // Checks if an array for comments exists in browser cache.
  public isInitialized() {
    return !!localStorage.getItem("comments");
  }

  // Creates a new, empty comment in browser cache.
  public createComment() {
    const comments: Array<CommentType> = commentStore.getComments();
    const comment = {
      id: v4(), // Newly generated UUID V4 ID string.
      comment: "", // Empty comment, for obvious reasons.
      user: sessionStore.loggedInUser!, // The current logged in user.
      date: Math.round(new Date().getTime()), // Time in ms since UNIX epoch.
    };
    comments.push(comment);
    commentStore.setComments(comments);
    return comment;
  }

  // Retrieves a comment with the given ID from browser cache.
  public getComment(id: string) {
    const comments: Array<CommentType> = JSON.parse(
      localStorage.getItem("comments")!
    );
    console.log(comments.filter((comment) => comment.id === id)[0].date);
    return comments.filter((comment) => comment.id === id)[0];
  }

  // Retrieves all comments from browser cache in an array.
  public getComments() {
    return JSON.parse(localStorage.getItem("comments")!);
  }

  // Sets the comments in browser cache to the given array of comments.
  public setComments(comments: Array<CommentType>) {
    localStorage.setItem("comments", JSON.stringify(comments));
  }
}

export const commentStore = new CommentStore();
