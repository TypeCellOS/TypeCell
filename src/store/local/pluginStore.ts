import { observable } from "mobx";
import { BaseResource } from "../BaseResource";
import { DocConnection } from "../DocConnection";
import PluginResource from "../PluginResource";

class PluginStore {
  private _plugins = observable.map<string, BaseResource>(undefined, {
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
      if (val.type) {
        if (val.type === "!plugin") {
          ret.add(val.getSpecificType(PluginResource)!);
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
