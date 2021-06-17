import { v4 } from "uuid";
import { sessionStore } from "../../../../store/local/stores";

export type CommentType = {
  id: string;
  comment: string;
  user: string;
  date: number;
  // Note: we currently store the resolvedAt time, but we do nothing (yet) with the resolved state or date,
  // e.g.: when resolving a comment, the mark is removed from the document. When the user then hits Undo,
  // the mark is re-added to the document, but the comment still shows as "unresoved" (i.e.: the user can resolve again)
  resolvedAt?: number;
  // TODO: resolvedByUser?
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
      date: Date.now(), // Time in ms since UNIX epoch.
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
    return comments.find((comment) => comment.id === id)!;
  }

  public updateComment(id: string, commentText: string) {
    const comments: Array<CommentType> = JSON.parse(
      localStorage.getItem("comments")!
    );
    const comment = comments.find((comment) => comment.id === id)!;
    comment.comment = commentText;
    comment.date = Date.now();
    this.setComments(comments);
  }

  public resolveComment(id: string) {
    const comments: Array<CommentType> = JSON.parse(
      localStorage.getItem("comments")!
    );
    const comment = comments.find((comment) => comment.id === id)!;
    comment.resolvedAt = Date.now();
    this.setComments(comments);
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
