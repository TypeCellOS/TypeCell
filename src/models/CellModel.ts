import * as Y from "yjs";

export class CellModel {
  /** @internal */
  constructor(
    private parentDocumentId: string,
    private fragment: Y.XmlElement
  ) {}

  public get language() {
    return "typescript";
  }

  public set language(value: string) {
    // return "typescript";
  }

  public get path() {
    return (
      "!@" +
      this.parentDocumentId.substr(1) +
      "/" +
      this.fragment.getAttribute("id") +
      ".tsx"
    );
  }

  /** @internal */
  public get code() {
    const child = this.fragment.firstChild;
    if (!(child instanceof Y.XmlText)) {
      throw new Error("should be text");
    }
    return child;
  }
}
