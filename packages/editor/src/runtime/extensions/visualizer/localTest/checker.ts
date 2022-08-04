/* eslint-disable @typescript-eslint/no-unused-expressions */
import { TypeVisualizer } from "../../../executor/lib/exports";
import * as mod from "./export";
import * as doc from "./visualizer";

// let tc = {
//   TypeVisualizer,
// };

// type arg0Type<T> = T extends (arg0: infer R, ...args: any[]) => void ? R : any;

type truePropertyNames<T> = {
  [K in keyof T]: T[K] extends never ? never : K;
}[keyof T];

type matchingPlugins<PluginsType, ObjectType> = any extends ObjectType
  ? never
  : truePropertyNames<{
      [K in keyof PluginsType]: ObjectType extends PluginsType[K] //arg0Type<PluginsType[K]>
        ? true
        : never;
    }>;

type RequireOnlyOne<T> = {
  [K in keyof T]: { type: T[K]; exclude: Exclude<keyof T, K> };
} extends {
  [K in keyof T]: { type: infer R; exclude: never };
}
  ? R
  : never;

// mainExportType.d.tsx
type mainExportType<T> = T extends {
  default: infer R;
}
  ? R
  : RequireOnlyOne<T> extends never
  ? T
  : RequireOnlyOne<T>;

//   type pluginTypes<T> = { [K in keyof T]: T[K] extends InstanceType<typeof tc["TypeVisualizer"]> ? T[K]["visualizer"]["function"] : never };
type pluginTypes<T> = {
  [K in keyof T]: T[K] extends TypeVisualizer<infer R>
    ? unknown extends R // filter out "any" types
      ? never
      : R
    : never;
};
type docPluginTypes = pluginTypes<typeof doc>;

type mainExportTypeModule = mainExportType<typeof mod>;
type pluginsPossible = matchingPlugins<docPluginTypes, mainExportTypeModule>;

// let test: Pick<docPluginTypes, pluginsPossible> = {} as any;
// test
let filteredPlugins: Pick<docPluginTypes, pluginsPossible> = {} as any;

// eslint-disable @typescript-eslint/no-unused-expressions
filteredPlugins.stringVisualizer;

// @ts-expect-error
filteredPlugins.anyValue;

// @ts-expect-error
filteredPlugins.numberVisualizer;

// @ts-expect-error
filteredPlugins.brokenVisualizer;

// TODO: support anyvisualizer
