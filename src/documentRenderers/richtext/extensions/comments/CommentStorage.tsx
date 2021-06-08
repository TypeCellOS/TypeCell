export class CommentStorage {
  public initialize() {
    // Initializes comments into a new map in browser cache, serialized into a string.
    localStorage.setItem(
      "comments",
      JSON.stringify(Array.from(new Map().entries()))
    );
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
    return new Map<number, string>(
      JSON.parse(localStorage.getItem("comments")!)
    );
  }

  public setComments(comments: Map<number, string>) {
    localStorage.setItem(
      "comments",
      JSON.stringify(Array.from(comments.entries()))
    );
  }
}
