import { observable } from "mobx";
import { DocConnection } from "../DocConnection";
import PluginResource from "../PluginResource";

class PluginStore {
  private _plugins = observable.map<string, DocConnection>(undefined, {
    deep: false,
  });

  // constructor() {
  // makeObservable(this, {
  //   plugins: observable.shallow,
  // });
  // }

  public loadPlugin(id: string) {
    if (!this._plugins.has(id)) {
      this._plugins.set(id, DocConnection.load(id));
    }
  }

  public get plugins() {
    const ret = new Set<PluginResource>();
    this._plugins.forEach((val) => {
      const doc = val.tryDoc;
      if (!doc) {
        // loading
        return;
      }
      if (doc.type) {
        if (doc.type === "!plugin") {
          ret.add(doc.getSpecificType(PluginResource)!);
        } else {
          throw new Error("unexpected, loaded plugin document of wrong type");
        }
      }
    });
    return ret;
  }
}

export const pluginStore = new PluginStore();
pluginStore.loadPlugin("@yousefed/projectplugin");
