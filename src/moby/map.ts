import { IAtom, createAtom } from "mobx";
import { observeText } from "./text";
import * as Y from "yjs";
import { observeYType } from ".";

const mapsObserved = new WeakSet<Y.Map<any>>();

export function observeMap(map: Y.Map<any>) {
  if (mapsObserved.has(map)) {
    // already patched
    return map;
  }
  mapsObserved.add(map);
  let selfAtom: IAtom | undefined;
  const atoms = new Map<string, IAtom>();

  function reportSelfAtom() {
    if (!selfAtom) {
      const handler = (event: Y.YMapEvent<any>) => {
        if (
          event.changes.added.size ||
          event.changes.deleted.size ||
          event.changes.keys.size ||
          event.changes.delta.length
        ) {
          selfAtom!.reportChanged();
        }
      };
      selfAtom = createAtom(
        "map",
        () => {
          map.observe(handler);
        },
        () => {
          map.unobserve(handler);
        }
      );
    }
    selfAtom.reportObserved();
  }

  function reportMapKeyAtom(key: string) {
    let atom = atoms.get(key);

    // possible optimization: only register a single handler for all keys
    if (!atom) {
      const handler = (event: Y.YMapEvent<any>) => {
        if (event.keysChanged.has(key)) {
          if (
            event.changes.added.size ||
            event.changes.deleted.size ||
            event.changes.keys.size ||
            event.changes.delta.length
          ) {
            atom!.reportChanged();
          }
        }
      };
      atom = createAtom(
        key,
        () => {
          map.observe(handler);
        },
        () => {
          map.unobserve(handler);
        }
      );
      atoms.set(key, atom);
    }

    atom.reportObserved();
  }

  const originalGet = map.get;

  map.get = function (key: string) {
    if (typeof key !== "string") {
      throw new Error("unexpected");
    }
    reportMapKeyAtom(key);
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

  const originalValues = map.values;
  map.values = function () {
    reportSelfAtom();
    const ret = Reflect.apply(originalValues, this, arguments);
    return ret;
  };

  const originalToJSON = map.toJSON;
  map.toJSON = function () {
    reportSelfAtom();
    const ret = Reflect.apply(originalToJSON, this, arguments);
    return ret;
  };

  return map;
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
