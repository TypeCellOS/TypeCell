import { YArray } from "yjs/dist/src/internals";

import * as Y from "yjs";
import { CellModel } from "./CellModel";

export class CellListModel {
  constructor(private documentId: string, private fragment: Y.XmlFragment) {}

  public get cells() {
    const elements = this.fragment.toArray().filter((val) => {
      return val instanceof Y.XmlElement && val.nodeName === "typecell";
    }) as Y.XmlElement[];

    return elements.map((el) => new CellModel(this.documentId, el)); // TODO: optimize
  }

  public addCell(i: number) {
    const element = new Y.XmlElement("typecell");
    element.setAttribute("id", Math.random() + "");
    element.insert(0, [new Y.XmlText("// hello")]);
    this.fragment.insert(i, [element]);
  }

  public removeCell(i: number) {}

  public moveCell(from: number, to: number) {
    // const old = detach(self.cells[from]); // this will update self.cells (remove old item)
    // self.cells.splice(to, 0, old);
  }
}
