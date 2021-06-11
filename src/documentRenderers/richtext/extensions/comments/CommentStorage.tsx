export type CommentType = {
  id: number;
  editable: boolean;
  comment: string;
  user: string;
  date: string;
};

export class CommentStorage {
  public initialize() {
    // Initializes comments into a new map in browser cache, serialized into a string.
    localStorage.setItem("comments", JSON.stringify(new Array<CommentType>()));
    // Initializes unique comment ID in browser cache.
    localStorage.setItem("commentID", "0");
  }
  public isInitialized() {
    return !!(
      localStorage.getItem("comments") && localStorage.getItem("commentID")
    );
  }

  public getId() {
    const id = parseInt(localStorage.getItem("commentID")!);
    localStorage.setItem("commentID", (id + 1).toString());
    return id;
  }

  public getComments() {
    return JSON.parse(localStorage.getItem("comments")!);
  }

  public setComments(comments: Array<CommentType>) {
    localStorage.setItem("comments", JSON.stringify(comments));
  }
}
