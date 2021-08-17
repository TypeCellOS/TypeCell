import { observable, untracked } from "mobx";
import { hookDefaultAnnotation } from "./mobx/customAnnotation";
import { isReactView } from "./reactView";
// import { Storage } from "./storage/Storage";

hookDefaultAnnotation();

export type TypeCellContext<T> = {
  context: T;
  viewContext: T;
  rawContext: T;
  // storage: Storage;
};

export function createContext<T>(storage?: Storage): TypeCellContext<T> {
  const observableContext = observable<any>({
    __esModule: true,
  });

  const proxy = new Proxy(observableContext, {
    get: (target, property, receiver) => {
      // if (typeof property === "string") {
      //   if (storage.hasStoredValue(property)) {
      //     return Reflect.get(storage, property, receiver);
      //   }
      // }

      const ret = Reflect.get(target, property, receiver);
      if (isReactView(ret)) {
        return ret.props.__tcObservable.get();
      }
      return ret;
    },
    set: (target, property, value, receiver) => {
      // if (typeof property === "string") {
      //   if (storage.hasStoredValue(property)) {
      //     return Reflect.set(storage, property, value, receiver);
      //   }
      // }
      const ret = untracked(() => Reflect.get(target, property, receiver));
      if (isReactView(ret)) {
        ret.props.__tcObservable.set(value);
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    },
  });

  const viewProxy = new Proxy(observableContext, {
    get: (target, property, receiver) => {
      // if (typeof property === "string") {
      //   if (storage.hasStoredValue(property)) {
      //     return Reflect.get(storage, property, receiver);
      //   }
      // }
      return Reflect.get(target, property, receiver);
    },
    set: (target, property, value, receiver) => {
      // if (typeof property === "string") {
      //   if (storage.hasStoredValue(property)) {
      //     return Reflect.set(storage, property, value, receiver);
      //   }
      // }

      return Reflect.set(target, property, value, receiver);
    },
  });

  return {
    rawContext: observableContext,
    context: proxy,
    viewContext: viewProxy,
    // storage,
  };
}
