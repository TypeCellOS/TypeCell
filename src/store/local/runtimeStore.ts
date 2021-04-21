import { makeObservable, observable } from "mobx";

export type ResourceType = {
  id: string;
  name: string;
};

class RuntimeStore {
  resourceTypes = observable.set<ResourceType>(undefined, { deep: false });

  constructor() {
    makeObservable(this, {
      // resourceTypes: observable.shallow,
    });
  }
}

export const runtimeStore = new RuntimeStore();
