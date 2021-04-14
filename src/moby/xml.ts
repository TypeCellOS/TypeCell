import { IAtom, createAtom } from "mobx";
import * as Y from "yjs";

const xmlAtoms = new WeakMap<Y.XmlFragment | Y.XmlText, IAtom>();

// TODO: use observe instead of observeDeep, but this would require hooking into more method calls.
export function observeXml(value: Y.XmlFragment | Y.XmlText) {
  let atom = xmlAtoms.get(value);
  if (!atom) {
    const handler = (_changes: Y.YEvent[]) => {
      atom!.reportChanged();
    };
    atom = createAtom(
      "xml",
      () => {
        value.observeDeep(handler);
      },
      () => {
        value.unobserveDeep(handler);
      }
    );
  }
  atom!.reportObserved();
  return value;
}
