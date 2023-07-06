import * as _ from "lodash";
import type * as Y from "yjs";
import { Identifier } from "../identifiers/Identifier";
import { CellListModel } from "../models/CellListModel";
import { CellModel } from "../models/CellModel";
import {
  BaseResource,
  BaseResourceExternalManager,
  UnimplementedBaseResourceExternalManager,
} from "./BaseResource";

/**
 * A resource with multiple cells, used for either the Notebook or Richtext built-in types
 */
export class DocumentResource extends BaseResource {
  /** @internal */
  constructor(
    ydoc: Y.Doc,
    identifier: Identifier,
    manager: BaseResourceExternalManager = UnimplementedBaseResourceExternalManager
  ) {
    super(ydoc, identifier, manager);
    if (this.type !== "!notebook" && this.type !== "!richtext") {
      throw new Error("invalid type for DocumentResource");
    }
  }

  public get title(): string | undefined {
    const baseTitle = super.title;
    if (baseTitle) {
      return baseTitle;
    }

    if (this.type === "!richtext") {
      if (
        (this.data.firstChild as any)?.firstChild?.firstChild?.nodeName ===
        "heading"
      ) {
        //hacky
        return (this.data.firstChild as any)?.firstChild?.firstChild?.firstChild
          ?.toString()
          .trim();
      }
      return undefined;
    }
    let cell = this.cells[0];
    if (!cell || cell.language !== "markdown") {
      return undefined;
    }

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
    if (this.type === "!richtext") {
      return this.blockCells;
    }
    return this.cellList.cells;
  }

  public get blockCells(): CellModel[] {
    const container = this.data.firstChild! as Y.XmlElement;

    const codeBlocks = container.toArray().filter((val) => {
      return (val as any).firstChild?.nodeName === "codeNode";
    }) as Y.XmlElement[];

    return codeBlocks.map((codeBlock) => {
      const id = codeBlock.getAttribute("id");
      return new CellModel(this.id, codeBlock.firstChild as Y.XmlElement, id);
    });
  }
}
