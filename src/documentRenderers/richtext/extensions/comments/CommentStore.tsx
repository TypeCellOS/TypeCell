import { v4 } from "uuid";
import { sessionStore } from "../../../../store/local/stores";

export type CommentType = {
  id: string;
  comment: string;
  user: string;
  date: string;
};

class CommentStore {
  public initialize() {
    // Initializes comments into a new map in browser cache, serialized into a string.
    localStorage.setItem("comments", JSON.stringify(new Array<CommentType>()));
  }

  public isInitialized() {
    return !!localStorage.getItem("comments");
  }

  public createComment() {
    const comments: Array<CommentType> = commentStore.getComments();
    const comment = {
      id: v4(),
      comment: "",
      user: sessionStore.loggedInUser!,
      date: new Date().toLocaleDateString("en-US"),
    };
    comments.push(comment);
    commentStore.setComments(comments);
    return comment;
  }

  public getComment(id: string) {
    const comments: Array<CommentType> = JSON.parse(
      localStorage.getItem("comments")!
    );
    const comment = comments.filter((comment) => comment.id === id)[0];
    console.log(this.getComments());
    return comment;
  }

  public getComments() {
    return JSON.parse(localStorage.getItem("comments")!);
  }

  public setComments(comments: Array<CommentType>) {
    localStorage.setItem("comments", JSON.stringify(comments));
  }
}

export const commentStore = new CommentStore();
