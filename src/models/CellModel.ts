import { YArray } from "yjs/dist/src/internals";

import * as Y from "yjs";

export class CellModel {
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

  public get code() {
    const child = this.fragment.firstChild;
    if (!(child instanceof Y.XmlText)) {
      throw new Error("should be text");
    }
    return child;
  }
}

const data = {
  children: [
    {
      guid: "root1",
      children: [{ guid: "sub1", children: [] }],
    },
    {
      guid: "root2",
    },
  ],
};

// const root1 {
//   refs: [
//     {namespace: "@workspace", owner: "project", type: "child", doc: "sub1"}
//   ],
//   backrefs: [
//     {namespace: "@workspace", owner: "project", type: "child", doc: "root"}
//   ]
// }

// const sub1 {
//   refs: [
//   ],
//   backrefs: [
//     {namespace: "@workspace", owner: "project", type: "child", doc: "root1"}
//   ]
// }
