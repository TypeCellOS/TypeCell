import { uniqueId } from "@typecell-org/common";
import * as _ from "lodash";
import * as Y from "yjs";
import { CellLanguage, CellModel } from "./CellModel";

export class CellListModel {
  /** @internal */
  constructor(private documentId: string, private fragment: Y.XmlFragment) {}

  private _previousChildren: any[] = [];
  private _previousCells: CellModel[] = [];
  private _previousCellsById = new Map<string, CellModel>();

  public get cells() {
    /**
     * because the observable of this.fragment will change anytime the text inside a <typecell> element changes,
     * we make an optimization here, to see whether the fragments have actually changed.
     * i.e.:
     * - we want to return a new value when a cell has been added (or it's id / language has changed)
     * - we don't want to return a new value when the contents of a cell have been modified
     */

    const children = this.fragment.toArray().filter((val) => {
      return val instanceof Y.XmlElement && val.nodeName === "typecell";
    }) as Y.XmlElement[];

    let changed = !_.isEqual(children, this._previousChildren);
    const newCells = [];
    const newCellsById = new Map<string, CellModel>();
    for (let child of children) {
      const id = child.getAttribute("block-id")!; // TODO: !
      const lang = child.getAttribute("language");

      const old = this._previousCellsById.get(id);

      if (!old || old.language !== lang || old.xmlElement !== child) {
        const cm = new CellModel(this.documentId, child);
        newCells.push(cm);
        newCellsById.set(id, cm);
        changed = true;
      } else {
        newCells.push(old);
        newCellsById.set(id, old);
      }
    }

    if (!changed) {
      return this._previousCells;
    }

    this._previousCells = newCells;
    this._previousChildren = children;
    this._previousCellsById = newCellsById;

    return this._previousCells;
  }

  public addCell(i: number, language: CellLanguage, content: string) {
    const element = new Y.XmlElement("typecell");
    element.setAttribute("block-id", uniqueId.generateId("block"));
    element.setAttribute("language", language);
    element.insert(0, [new Y.XmlText(content)]);
    this.fragment.insert(i, [element]);
  }

  // theoretically, the fragment could contain other elements than <typecell> elements,
  // e.g.: when we're rendering a !richtext type as a notebook.
  private findIndexByTypecellIndex(i: number) {
    const typecellChildren = this.fragment.toArray().filter((val) => {
      return val instanceof Y.XmlElement && val.nodeName === "typecell";
    }) as Y.XmlElement[];
    const index = this.fragment
      .toArray()
      .findIndex((el) => el === typecellChildren[i]);
    if (index !== i) {
      console.warn("warning: typecell index doesn't equal fragment index");
    }
    if (index < 0) {
      throw new Error("element not found");
    }
    return index;
  }
  // TODO: for good multiplayer, should work by id?
  public removeCell(i: number) {
    this.fragment.delete(this.findIndexByTypecellIndex(i));
  }

  // TODO: for good multiplayer, should work with fractional indices?
  moveCell = (from: number, to: number) => {
    const index = this.findIndexByTypecellIndex(from);
    const toIndex = this.findIndexByTypecellIndex(to);

    const element = this.fragment.get(index);
    if (!(element instanceof Y.XmlElement)) {
      throw new Error("unexpected element type");
    }
    let copy = new Y.XmlElement("typecell");
    copy.setAttribute("language", element.getAttribute("language")!);
    copy.setAttribute("block-id", element.getAttribute("block-id")!);
    copy.insert(0, [new Y.XmlText((element.firstChild! as Y.Text).toString())]);
    this.fragment.delete(index);

    this.fragment.insert(toIndex, [copy]);
  };
}
