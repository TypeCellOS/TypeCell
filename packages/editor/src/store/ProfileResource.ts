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
    manager: BaseResourceExternalManager = UnimplementedBaseResourceExternalManager,
  ) {
    super(ydoc, identifier, manager);
    if (this.type !== "!profile") {
      throw new Error("invalid type for ProfileResource");
    }
  }

  public get joinedDate(): number {
    return this.ydoc.getMap("profile").get("joined_at") as number;
  }

  public set joinedDate(value: number) {
    this.ydoc.getMap("profile").set("joined_at", value);
  }

  public get username(): string {
    return this.ydoc.getMap("profile").get("username") as string;
  }

  public set username(value: string) {
    this.ydoc.getMap("profile").set("username", value);
  }

  public get avatar_url(): string {
    return this.ydoc.getMap("profile").get("avatar_url") as string;
  }

  public set avatar_url(value: string) {
    this.ydoc.getMap("profile").set("avatar_url", value);
  }

  public get title(): string {
    return "@" + this.username;
  }

  // TODO: if profile is public, then we can currently see the names of all workspaces
  // TODO: migrate to refs?
  public get workspaces() {
    const ret = this.ydoc.getMap<string>("workspaces");

    return ret;
  }

  // these documents (forks) don't have a parent workspace, so we store them on the profile
  // (perhaps not the nicest architecture, but we probably want to revisit the concept of forking entirely)
  // TODO: migrate to refs?
  public get forks() {
    // we use a map with the same value (identifier) as key and value, effectively using it as a set
    const ret = this.ydoc.getMap<string>("forks");

    return ret;
  }
}
