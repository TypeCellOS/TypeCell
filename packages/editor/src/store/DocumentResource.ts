import * as _ from "lodash";
import type * as Y from "yjs";
import { CellListModel } from "../models/CellListModel";
import { BaseResource } from "./BaseResource";
import { DocConnection } from "./DocConnection";

/**
 * A resource with multiple cells, used for either the Notebook or Richtext built-in types
 */
export class DocumentResource extends BaseResource {
  /** @internal */
  constructor(ydoc: Y.Doc, connection: DocConnection, inboxLoader: any) {
    super(ydoc, connection, inboxLoader);
    if (this.type !== "!notebook" && this.type !== "!richtext") {
      throw new Error("invalid type for DocumentResource");
    }
  }

  /** @internal */
  public get title(): Y.Text {
    return this.ydoc.getText("title");
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
