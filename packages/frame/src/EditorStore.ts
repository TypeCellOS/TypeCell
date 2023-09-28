import { action, makeObservable, observable } from "mobx";

export class EditorStore {
  constructor() {
    makeObservable(this, {
      customBlocks: observable.shallow,
      add: action,
      delete: action,
    });
  }

  customBlocks = new Map<string, any>();

  public add(config: any) {
    if (this.customBlocks.has(config.id)) {
      // already has block with this id, maybe loop of documents?
      return;
    }
    this.customBlocks.set(config.id, config);
  }

  public delete(config: any) {
    this.customBlocks.delete(config.id);
  }
}
