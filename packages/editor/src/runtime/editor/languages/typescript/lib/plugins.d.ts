// let plugins = {
//   takesString: (arg: string) => {},
//   takesNumber: (arg: number) => {},
// };

// type PluginsType = typeof plugins;

// type matches = matchingPlugins<PluginsType, any>;
// type matches = matchingPlugins<PluginsType, string>;

type arg0Type<T> = T extends (arg0: infer R, ...args: any[]) => void ? R : any;

type truePropertyNames<T> = {
  [K in keyof T]: T[K] extends never ? never : K;
}[keyof T];

export type matchingPlugins<PluginsType, ObjectType> = any extends ObjectType // don't match plugins for any (any can also indicate compile error of the cell)
  ? never
  : truePropertyNames<
      {
        [K in keyof PluginsType]: ObjectType extends arg0Type<PluginsType[K]>
          ? true
          : never;
      }
    >;
