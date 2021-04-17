import { IAtom, createAtom, untracked } from "mobx";
import * as Y from "yjs";
import { observeYType } from ".";

const xmlAtoms = new WeakMap<Y.XmlFragment | Y.XmlText, IAtom>();

export function observeXml(value: Y.XmlFragment) {
  let atom = xmlAtoms.get(value);
  if (!atom) {
    const handler = (event: Y.YXmlEvent) => {
      event.changes.added.forEach((added) => {
        if (added.content instanceof Y.ContentType) {
          const addedType = added.content.type;
          untracked(() => {
            observeYType(addedType);
          });
        }
      });
      atom!.reportChanged();
    };

    atom = createAtom(
      "xml",
      () => {
        value.observe(handler);
      },
      () => {
        value.unobserve(handler);
      }
    );

    const originalToString = value.toString;
    value.toString = function () {
      atom!.reportObserved();
      const ret = Reflect.apply(originalToString, this, arguments);
      return ret;
    };
  }
  xmlAtoms.set(value, atom);

  untracked(() => {
    value.toArray().forEach((val) => {
      observeYType(val);
    });
  });

  atom!.reportObserved();
  return value;
}
