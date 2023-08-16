import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import {
  BaseResource,
  BaseResourceExternalManager,
  UnimplementedBaseResourceExternalManager,
} from "./BaseResource";

/**
 * A Resource defining a user / organization profile
 */
export default class ProfileResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    identifier: Identifier,
    manager: BaseResourceExternalManager = UnimplementedBaseResourceExternalManager
  ) {
    super(ydoc, identifier, manager);
    if (this.type !== "!profile") {
      throw new Error("invalid type for ProfileResource");
    }
  }

  public get username(): string {
    return this.ydoc.getMap("profile").get("username") as string;
  }

  public set username(value: string) {
    this.ydoc.getMap("profile").set("username", value);
  }

  public get title(): string {
    return "@" + this.username;
  }

  // TODO: if profile is public, then we can currently see the names of all workspaces
  public get workspaces() {
    const ret = this.ydoc.getMap<string>("workspaces");

    return ret;
  }

  // these documents (forks) don't have a parent workspace, so we store them on the profile
  // (perhaps not the nicest architecture, but we probably want to revisit the concept of forking entirely)
  public get forks() {
    // we use a map with the same value (identifier) as key and value, effectively using it as a set
    const ret = this.ydoc.getMap<string>("forks");

    return ret;
  }
}
