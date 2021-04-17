import * as Y from "yjs";
import { CellListModel } from "../models/CellListModel";
import * as _ from "lodash";
// (window as any).documents = documentCache;
// const subDocCache = new Map<string, Y.Doc>();
import { Awareness } from "y-protocols/awareness";
import LoadingTCDocument from "./LoadingTCDocument";
export default class TCDocument {
  public constructor(
    private readonly _loadingDoc: LoadingTCDocument, // TODO: circular reference
    private readonly _ydoc: Y.Doc
  ) {}

  public get id() {
    return this._loadingDoc.id;
  }
  public get webrtcProvider() {
    return this._loadingDoc.webrtcProvider;
  }

  public get title(): Y.Text {
    return this._ydoc.getText("title");
  }

  public get type(): string {
    return this._ydoc.getMap("meta").get("type");
  }

  public set type(type: string) {
    if (!this.type) {
      throw new Error(
        "to initialize document with a type, use .create(type) instead"
      );
    }
    this._ydoc.getMap("meta").set("type", type);
  }

  public get data(): Y.XmlFragment {
    let xml = this._ydoc.getXmlFragment("doc");
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
