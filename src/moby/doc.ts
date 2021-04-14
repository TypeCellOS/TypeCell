import * as Y from "yjs";
import { observeYType } from ".";

const docsObserved = new WeakSet<Y.Doc>();

export function observeDoc(doc: Y.Doc) {
  if (docsObserved.has(doc)) {
    // already patched
    return doc;
  }
  docsObserved.add(doc);

  const originalGet = doc.get;

  doc.get = function (key: string) {
    if (typeof key !== "string") {
      throw new Error("unexpected");
    }
    const ret = Reflect.apply(originalGet, this, arguments);
    if (!ret) {
      return ret;
    }
    if (
      ret instanceof Y.AbstractType ||
      Object.prototype.hasOwnProperty.call(ret, "autoLoad")
    ) {
      return observeYType(ret);
    }
    return ret;
  };

  return doc;
}

/*
    let x = new Proxy(
      {},
      {
        get: (target, p, receiver) => {
          if (typeof p === "string") {
            reportMapKeyAtom(p);
          }
          const ret = Reflect.get(target, p, receiver);
          if (ret.$proxy) {
            return ret.$proxy;
          }
  
          if ()
  
          return ret;
        },
        has: (target, p) => {
          if (typeof p === "string") {
            reportMapKeyAtom(p);
          }
          const ret = Reflect.has(target, p);
          return ret;
        },
      }
    );*/
