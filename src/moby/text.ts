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
  }
  atom!.reportObserved();
  return value;
}
