import { autorun } from "mobx";
import { pluginStore } from "../store/local/pluginStore";
import PluginResource from "../store/PluginResource";
import PluginEngine from "./PluginEngine";

const runningPlugins = new Map<PluginResource, PluginEngine>();

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
        engine.dispose();
        runningPlugins.delete(plugin);
      }
    });

    pluginStore.plugins.forEach((plugin) => {
      if (!runningPlugins.has(plugin)) {
        // add
        const engine = new PluginEngine(plugin, undefined as any /* TODO */);
        runningPlugins.set(plugin, engine);
      }
    });
  });
}
