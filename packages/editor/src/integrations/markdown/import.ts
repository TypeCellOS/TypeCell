import { uniqueId } from "@typecell-org/common";
import * as parsers from "@typecell-org/parsers";

import * as Y from "yjs";

export function markdownToYDoc(markdown: string) {
  const nbData = parsers.markdownToDocument(markdown);
  const newDoc = new Y.Doc();
  newDoc.getMap("meta").set("type", "!notebook");

  let xml = newDoc.getXmlFragment("doc");
  const elements = nbData.cells.map((cell) => {
    const element = new Y.XmlElement("typecell");
    element.setAttribute("block-id", uniqueId.generate()); // TODO: do we want random blockids? for markdown sources?

    if (cell.language === "markdown") {
      element.insert(0, [new Y.XmlText(cell.code)]);
      element.setAttribute("language", "markdown");
    } else {
      element.insert(0, [new Y.XmlText(cell.code)]);
      element.setAttribute("language", cell.language);
    }

    return element;
  });
  xml.insert(0, elements);

  return newDoc;
}
