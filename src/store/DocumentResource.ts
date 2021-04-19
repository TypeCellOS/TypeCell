import * as _ from "lodash";
import * as Y from "yjs";
import { CellListModel } from "../models/CellListModel";
import { BaseResource } from "./BaseResource";

export class DocumentResource extends BaseResource {
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
