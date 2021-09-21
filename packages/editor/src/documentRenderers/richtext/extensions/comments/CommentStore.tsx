import { v4 } from "uuid";

import * as Y from "yjs";
import { getStoreService } from "../../../../store/local/stores";

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
export class CommentStore {
  constructor(private readonly map: Y.Map<CommentType>) { }

  // Creates a new, empty comment in browser cache.
  public createComment() {
    const comment = {
      id: v4(), // Newly generated UUID V4 ID string.
      comment: "", // Empty comment, for obvious reasons.
      user: getStoreService().sessionStore.loggedInUser!, // The current logged in user.
      date: Date.now(), // Time in ms since UNIX epoch.
    };
    this.map.set(comment.id, comment);
    return comment;
  }

  // Retrieves a comment with the given ID from browser cache.
  public getComment(id: string) {
    return this.map.get(id) as CommentType;
  }

  public updateComment(id: string, commentText: string) {
    const comment = this.getComment(id);
    comment.comment = commentText;
    comment.date = Date.now();
    this.map.set(id, comment);
  }

  public resolveComment(id: string) {
    const comment = this.getComment(id);
    comment.resolvedAt = Date.now();
    this.map.set(id, comment);
  }
}
