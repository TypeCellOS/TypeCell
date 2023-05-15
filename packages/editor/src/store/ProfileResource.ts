import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import { BaseResource, BaseResourceConnection } from "./BaseResource";

/**
 * A Resource defining a user / organization profile
 */
export default class ProfileResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    connectionOrIdentifier: BaseResourceConnection | Identifier,
    inboxLoader: any
  ) {
    super(ydoc, connectionOrIdentifier as any, inboxLoader); // TODO
    if (this.type !== "!profile") {
      throw new Error("invalid type for ProfileResource");
    }
  }

  // TODO: if profile is public, then we can currently see the names of all workspaces
  public get workspaces() {
    const ret = this.ydoc.getMap<string>("workspaces");

    return ret;
  }
}
