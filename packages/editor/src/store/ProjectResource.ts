import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import {
  BaseResource,
  BaseResourceExternalManager,
  UnimplementedBaseResourceExternalManager,
} from "./BaseResource";

/**
 * A Resource defining a project directory
 */
export default class ProjectResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    identifier: Identifier,
    manager: BaseResourceExternalManager = UnimplementedBaseResourceExternalManager,
  ) {
    super(ydoc, identifier, manager);
    if (this.type !== "!project") {
      throw new Error("invalid type for PluginResource");
    }
  }
}
