import { uniqueId } from "@typecell-org/common";
import * as parsers from "@typecell-org/parsers";

import * as Y from "yjs";

export function markdownToXmlFragment(
  markdown: string,
  fragment: Y.XmlFragment | undefined
) {
  if (!fragment) {
    const containerDoc = new Y.Doc(); // the doc is needed because otherwise the fragment doesn't work
    fragment = containerDoc.getXmlFragment("doc");
  }
  const nbData = parsers.markdownToDocument(markdown);

  const elements = nbData.cells.map((cell) => {
    const element = new Y.XmlElement("typecell");
    element.setAttribute("block-id", uniqueId.generateId("block")); // TODO: do we want random blockids? for markdown sources?

    if (cell.language === "markdown") {
      element.insert(0, [new Y.XmlText(cell.code)]);
      element.setAttribute("language", "markdown");
    } else {
      element.insert(0, [new Y.XmlText(cell.code)]);
      element.setAttribute("language", cell.language);
    }

    return element;
  });
  fragment.insert(0, elements);
  return fragment;
}

export function markdownToYDoc(markdown: string, title?: string) {
  const newDoc = new Y.Doc();
  newDoc.getMap("meta").set("type", "!notebook");

  let xml = newDoc.getXmlFragment("doc");
  markdownToXmlFragment(markdown, xml);

  if (title) {
    newDoc.getMap("meta").set("title", title);
    // newDoc.getText("title").delete(0, newDoc.getText("title").length);
    // newDoc.getText("title").insert(0, title);
  }

  return newDoc;
}
