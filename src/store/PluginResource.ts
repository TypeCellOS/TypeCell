import { CellModel } from "../models/CellModel";
import { BaseResource, BaseResourceConnection } from "./BaseResource";
import type * as Y from "yjs";
import { NotebookCellModel } from "../documentRenderers/notebook/NotebookCellModel";
import { Identifier } from "../identifiers/Identifier";

/**
 * A Resource defining a plugin. Plugins have a description and a single cell with code,
 * which is responsible for registering the plugin hooks.
 */
export default class PluginResource extends BaseResource {
  /** @internal */
  constructor(ydoc: Y.Doc, connection: BaseResourceConnection | Identifier) {
    super(ydoc, connection);
    if (this.type !== "!plugin") {
      throw new Error("invalid type for PluginResource");
    }
  }

  // TODO: turn into Y.Text
  public set description(descr: string) {
    this.ydoc.getMap("pluginmeta").set("description", descr);
  }

  public get description(): string {
    const descr = this.ydoc.getMap("pluginmeta").get("description");
    if (!descr) {
      return "";
    }
    if (typeof descr !== "string") {
      throw new Error("expected string");
    }
    return descr;
  }

  private _pluginCell: NotebookCellModel | undefined;

  /** @internal */
  public get pluginCell() {
    this._pluginCell = this._pluginCell || {
      code: this.ydoc.getText("pluginCell"),
      id: this.id,
      path: "!@" + this.id.substr(1) + "/plugin.tsx",
      language: "typescript",
    };

    return this._pluginCell;
  }
}
