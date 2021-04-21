import * as _ from "lodash";
import * as Y from "yjs";
import { CellModel } from "./CellModel";

export class CellListModel {
  /** @internal */
  constructor(private documentId: string, private fragment: Y.XmlFragment) {}

  private _previousChildren: any[] = [];
  private _previousCells: CellModel[] = [];

  public get cells() {
    /**
     * because the observable of this.fragment will change anytime the text inside a <typecell> element changes,
     * we make an optimization here, to see whether the fragments have actually changed.
     * i.e.:
     * - we want to return a new value when a cell has been added
     * - we don't want to return a new value when the contents of a cell have been modified
     *
     * TODO: also return the previous value of other elements in case a cell has added. Perhaps use WeakMap<Fragment, CellModel>?
     */

    const children = this.fragment.toArray().filter((val) => {
      return val instanceof Y.XmlElement && val.nodeName === "typecell";
    }) as Y.XmlElement[];

    if (_.isEqual(children, this._previousChildren)) {
      return this._previousCells;
    }

    this._previousChildren = children;
    this._previousCells = children.map((el) => {
      const path =
        "!@" +
        this.documentId.substr(1) +
        "/" +
        el.getAttribute("id") +
        ".cell.tsx";

      const code = el.firstChild;
      if (!(code instanceof Y.XmlText)) {
        throw new Error("should be text");
      }
      return new CellModel(path, code);
    });
    return this._previousCells;
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
