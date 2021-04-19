import * as _ from "lodash";
import * as Y from "yjs";
import { CellListModel } from "../models/CellListModel";
import { BaseResource } from "./BaseResource";
import { DocConnection } from "./DocConnection";

/**
 * A resource with multiple cells, used for either the Notebook or Richtext built-in types
 */
export class DocumentResource extends BaseResource {
  constructor(connection: DocConnection) {
    super(connection);
    if (this.type !== "!notebook" && this.type !== "richtext") {
      throw new Error("invalid type for DocumentResource");
    }
  }

  public get title(): Y.Text {
    return this.ydoc.getText("title");
  }

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
