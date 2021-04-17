import * as Y from "yjs";
import { CellListModel } from "../models/CellListModel";
import * as _ from "lodash";
// (window as any).documents = documentCache;
// const subDocCache = new Map<string, Y.Doc>();
import { Awareness } from "y-protocols/awareness";
import LoadingTCDocument from "./LoadingTCDocument";
export default class TCDocument {
  public constructor(
    private readonly loadingDoc: LoadingTCDocument, // TODO: circular reference
    private readonly ydoc: Y.Doc
  ) {}

  public get id() {
    return this.loadingDoc.id;
  }
  public get webrtcProvider() {
    return this.loadingDoc.webrtcProvider;
  }

  public get title(): Y.Text {
    return this.ydoc.getText("title");
  }

  public get type(): string {
    return this.ydoc.getMap("meta").get("type");
  }

  public set type(type: string) {
    if (!this.type) {
      throw new Error(
        "to initialize document with a type, use .create(type) instead"
      );
    }
    this.ydoc.getMap("meta").set("type", type);
  }

  public get refs(): Y.Map<any> {
    let map: Y.Map<any> = this.ydoc.getMap("refs");
    return map;
  }

  public get data(): Y.XmlFragment {
    let xml = this.ydoc.getXmlFragment("doc");
    return xml;
  }

  private getCellListMemoized = _.memoize(
    (data: Y.XmlFragment) => new CellListModel(this.id, data)
  );

  public get cellList() {
    return this.getCellListMemoized(this.data);
  }

  public get cells() {
    return this.cellList.cells;
  }
}
