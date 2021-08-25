import * as Y from "yjs";
import { NotebookCellModel } from "../documentRenderers/notebook/NotebookCellModel";
import { UnreachableCaseError } from "../util/UnreachableCaseError";

export type CellLanguage = "typescript" | "markdown" | "css";
const VALID_LANGUAGES = ["typescript", "markdown", "css"];
export class CellModel implements NotebookCellModel {
  /** @internal */
  public readonly code: Y.Text;
  public readonly id: string;
  public readonly language: CellLanguage;

  /** @internal */
  constructor(
    public readonly parentDocumentId: string,
    /** @internal */
    public readonly xmlElement: Y.XmlElement // public readonly path: string, // /** @internal */ // public readonly code: Y.Text
  ) {
    const id = xmlElement.getAttribute("block-id");
    if (!id) {
      throw new Error("no id specified");
    }
    this.id = id;

    const code = xmlElement.firstChild;
    if (!code || !(code instanceof Y.XmlText)) {
      throw new Error("should be text");
    }
    this.code = code;

    let attrLanguage = xmlElement.getAttribute("language");
    if (!attrLanguage) {
      console.warn("setting default language to typescript");
      attrLanguage = "typescript";
      xmlElement.setAttribute("language", attrLanguage);
    }
    if (!VALID_LANGUAGES.includes(attrLanguage)) {
      throw new Error("unexpected language for cell");
    }
    this.language = attrLanguage as CellLanguage;
  }

  public setLanguage(value: CellLanguage) {
    this.xmlElement.setAttribute("language", value);
  }

  public get extension() {
    if (this.language === "typescript") {
      return "tsx";
    } else if (this.language === "markdown") {
      return "md";
    } else if (this.language === "css") {
      return "css";
    } else {
      throw new UnreachableCaseError(this.language);
    }
  }

  public get path() {
    return (
      "!@" + this.parentDocumentId + "/" + this.id + ".cell." + this.extension
    );
  }

  // /** @internal */
  // public get code() {
  //   const child = this.fragment.firstChild;
  //   if (!(child instanceof Y.XmlText)) {
  //     throw new Error("should be text");
  //   }
  //   return child;
  // }
}
