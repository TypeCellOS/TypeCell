import { DocumentResource } from "../../store/DocumentResource";
import * as Y from "yjs";

export function openAsMarkdown(doc: DocumentResource) {
  const markdown = docResourceToMarkdown(doc);
  const newBlob = new Blob([markdown], { type: "text/markdown" });
  const fileObjectURL = URL.createObjectURL(newBlob);
  window.open(fileObjectURL, "_blank");
  setTimeout(() => {
    URL.revokeObjectURL(fileObjectURL);
  }, 3000);
}

function docResourceToMarkdown(doc: DocumentResource) {
  if (doc.type !== "!notebook") {
    throw new Error("only supported for notebooks");
  }

  return xmlFragmentToMarkdown(doc.data);
}

// TODO: would be nicer here to not have dependency on Yjs,
// but use DocumentResource.cells instead.
// However, this is also called from YDocFileSyncManager, so we'd need to refactor that
export function xmlFragmentToMarkdown(xml: Y.XmlFragment) {
  const elements = xml.toArray().map((el) => {
    if (!(el instanceof Y.XmlElement)) {
      throw new Error("invalid type");
    }
    if (el.nodeName !== "typecell") {
      throw new Error("invalid nodename");
    }
    const language = el.getAttribute("language");
    if (!(el.firstChild instanceof Y.Text) || el.length !== 1) {
      throw new Error("invalid typecell element");
    }
    const content = el.firstChild.toJSON() as string;
    if (language === "markdown") {
      return content;
    } else {
      return "```" + language + "\n" + content + "\n```";
    }
  });

  return elements.join("\n");
}
