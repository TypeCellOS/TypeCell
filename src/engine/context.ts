import { observable } from "mobx";
import { hookDefaultAnnotation } from "./mobx/customAnnotation";
// import { Storage } from "./storage/Storage";

hookDefaultAnnotation();

export type TypeCellContext<T> = {
  context: T;
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
    context: proxy,
    // storage,
  };
}
