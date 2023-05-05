import * as _ from "lodash";
import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import { CellListModel } from "../models/CellListModel";
import { BaseResource, BaseResourceConnection } from "./BaseResource";

/**
 * A resource with multiple cells, used for either the Notebook or Richtext built-in types
 */
export class DocumentResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    connectionOrIdentifier: BaseResourceConnection | Identifier,
    inboxLoader: any
  ) {
    super(ydoc, connectionOrIdentifier as any, inboxLoader);
    if (this.type !== "!notebook" && this.type !== "!richtext") {
      throw new Error("invalid type for DocumentResource");
    }
  }

  public get title(): string | undefined {
    const baseTitle = super.title;
    if (baseTitle) {
      return baseTitle;
    }

    let cell = this.cells[0];
    if (!cell || cell.language !== "markdown") {
      return undefined;
    }

    debugger;
    const match = cell.code.toJSON().match(/^# (.*)$/m);
    if (match) {
      return match[1].trim();
    }

    return undefined;
  }

  /** @internal */
  public get comments(): Y.Map<any> {
    return this.ydoc.getMap("comments");
  }

  /** @internal */
  public get data(): Y.XmlFragment {
    let xml = this.ydoc.getXmlFragment("doc");
    return xml;
  }

  private _getCellListMemoized = _.memoize(
    (data: Y.XmlFragment) => new CellListModel(this.id, data)
  );

  public get cellList() {
    return this._getCellListMemoized(this.data);
  }

  public get cells() {
    return this.cellList.cells;
  }
}
