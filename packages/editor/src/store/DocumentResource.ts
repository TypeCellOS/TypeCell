import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import {
  BaseResource,
  BaseResourceExternalManager,
  UnimplementedBaseResourceExternalManager,
} from "./BaseResource";

/**
 * A resource with multiple cells, used for either the Notebook or Richtext built-in types
 */
export class DocumentResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    identifier: Identifier,
    manager: BaseResourceExternalManager = UnimplementedBaseResourceExternalManager
  ) {
    super(ydoc, identifier, manager);
    if (this.type !== "!notebook" && this.type !== "!richtext") {
      throw new Error("invalid type for DocumentResource");
    }
  }

  public get title(): string | undefined {
    const baseTitle = super.title;
    if (baseTitle) {
      return baseTitle;
    }

    return "TODO";
    // let cell = this.cells[0];
    // if (!cell || cell.language !== "markdown") {
    //   return undefined;
    // }

    // const match = cell.code.toJSON().match(/^# (.*)$/m);
    // if (match) {
    //   return match[1].trim();
    // }

    // return undefined;
  }

  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get comments(): Y.Map<any> {
    return this.ydoc.getMap("comments");
  }

  /** @internal */
  public get data(): Y.XmlFragment {
    const xml = this.ydoc.getXmlFragment("doc");
    return xml;
  }
}
