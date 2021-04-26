import { IAtom, createAtom } from "mobx";
import * as Y from "yjs";
import { isYType, observeYJS } from ".";

const arraysObserved = new WeakSet<Y.Array<any>>();

export function observeMap(array: Y.Array<any>) {
  if (arraysObserved.has(array)) {
    // already patched
    return array;
  }
  arraysObserved.add(array);

  let selfAtom: IAtom | undefined;
  const atoms = new Map<number, IAtom>();

  function reportSelfAtom() {
    if (!selfAtom) {
      const handler = (_changes: Y.YArrayEvent<any>) => {
        selfAtom!.reportChanged();
      };
      selfAtom = createAtom(
        "map",
        () => {
          array.observe(handler);
        },
        () => {
          array.unobserve(handler);
        }
      );
    }
  }

  function reportArrayElementAtom(key: number) {
    let atom = atoms.get(key);

    // possible optimization: only register a single handler for all keys
    if (!atom) {
      const handler = (changes: Y.YArrayEvent<any>) => {
        // TODO
        // if (changes.keys.has(key)) {
        atom!.reportChanged();
        // }
      };
      atom = createAtom(
        key + "",
        () => {
          array.observe(handler);
        },
        () => {
          array.unobserve(handler);
        }
      );
      atoms.set(key, atom);
    }

    atom.reportObserved();
  }

  const originalGet = array.get;

  array.get = function (key: number) {
    if (typeof key !== "number") {
      throw new Error("unexpected");
    }
    reportArrayElementAtom(key);
    const ret = Reflect.apply(originalGet, this, arguments);
    if (!ret) {
      return ret;
    }
    if (isYType(ret)) {
      return observeYJS(ret);
    }
    return ret;
  };

  const originalValues = array.toArray;
  array.toArray = function () {
    reportSelfAtom();
    const ret = Reflect.apply(originalValues, this, arguments);
    return ret;
  };

  return array;
}
