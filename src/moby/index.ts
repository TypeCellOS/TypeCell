import { AbstractType } from "yjs";

import { observeText } from "./text";
import * as Y from "yjs";
import { observeMap } from "./map";
import { observeDoc } from "./doc";
import { observeXml } from "./xml";

export function observeYType(element: Y.AbstractType<any> | Y.Doc) {
  if (element instanceof Y.XmlText) {
    return observeText(element);
  } else if (element instanceof Y.Text) {
    return observeText(element);
  } else if (element instanceof Y.Array) {
  } else if (element instanceof Y.Map) {
    return observeMap(element);
  } else if (
    element instanceof Y.Doc ||
    Object.prototype.hasOwnProperty.call(element, "autoLoad")
  ) {
    // subdoc. Ok way to detect this?
    return observeDoc((element as any) as Y.Doc);
  } else if (element instanceof Y.XmlFragment) {
    return observeXml(element);
  } else if (element instanceof Y.XmlElement) {
    return observeXml(element);
  } else {
    if (element._item === null && element._start === null) {
      // console.warn("edge case");
    } else {
      // throw new Error("not yet supported");
    }
  }
  return element;
}
