import { IAtom, createAtom } from "mobx";
import * as Y from "yjs";

const textAtoms = new WeakMap<Y.Text, IAtom>();

export function observeText(value: Y.Text) {
  let atom = textAtoms.get(value);
  if (!atom) {
    const handler = (_changes: Y.YTextEvent) => {
      atom!.reportChanged();
    };
    atom = createAtom(
      "text",
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
    textAtoms.set(value, atom);
  }
  atom!.reportObserved();
  return value;
}
