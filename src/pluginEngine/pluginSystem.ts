import { autorun } from "mobx";
import { getModel, releaseModel } from "../models/modelCache";
import { pluginStore } from "../store/local/pluginStore";
import PluginResource from "../store/PluginResource";
import PluginEngine from "./PluginEngine";

const runningPlugins = new Map<PluginResource, PluginEngine>();

function createNewPluginEngine(plugin: PluginResource) {
  const engine = new PluginEngine(plugin.id);
  engine.engine.registerModel(getModel(plugin.pluginCell));
  return engine;
}

export function getEngineForPlugin(plugin: PluginResource) {
  const engine = runningPlugins.get(plugin);
  if (!engine) {
    throw new Error("plugin not running");
  }
  return engine;
}

export function enablePluginSystem() {
  autorun(() => {
    runningPlugins.forEach((engine, plugin) => {
      if (!pluginStore.plugins.has(plugin)) {
        // dispose
        releaseModel(plugin.pluginCell);
        engine.dispose();
        runningPlugins.delete(plugin);
      }
    });

    pluginStore.plugins.forEach((plugin) => {
      if (!runningPlugins.has(plugin)) {
        // add
        const engine = createNewPluginEngine(plugin);
        runningPlugins.set(plugin, engine);
      }
    });
  });
}
