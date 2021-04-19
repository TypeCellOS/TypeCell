import * as _ from "lodash";
import * as Y from "yjs";
import { CellListModel } from "../models/CellListModel";
import { BaseResource } from "./BaseResource";

export default class PluginResource extends BaseResource {
  public get description(): Y.Text {
    return this.ydoc.getText("description");
  }

  // public get type(): string {
  //   return this._loadingResource.type;
  // }

  public get data(): Y.XmlFragment {
    let xml = this.ydoc.getXmlFragment("doc");
    return xml;
  }

  private _getCellListMemoized = _.memoize(
    (data: Y.XmlFragment) => new CellListModel(this.id, data)
  );

  private get cellList() {
    const list = this._getCellListMemoized(this.data);
    if (list.cells.length !== 1) {
      throw new Error("expected only 1 cell");
    }
    return list;
  }

  public get pluginCell() {
    return this.cellList.cells[0];
  }
}
