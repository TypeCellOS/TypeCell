import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import { BaseResource, BaseResourceConnection } from "./BaseResource";

/**
 * A Resource defining a project directory
 */
export default class ProjectResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    connectionOrIdentifier: BaseResourceConnection | Identifier
  ) {
    super(ydoc, connectionOrIdentifier as any); // TODO
    if (this.type !== "!project") {
      throw new Error("invalid type for PluginResource");
    }
  }

  public get files() {
    return this.ydoc.getMap("files");
  }
}
