// detects difference between objects with multiple properties and just 1 property
// export default { x: 5, b: 4 };
// vs
// export default { x: 5 };
type RequireOnlyOne<T> = {
  [K in keyof T]: { type: T[K]; exclude: Exclude<keyof T, K> };
} extends {
  [K in keyof T]: { type: infer R; exclude: never };
}
  ? R
  : never;

// the main (visualized) export of a module in typescript is defined as:
// 1. module.default if available
// 2. else, if there is only one member in the module, that member
// 3. else, the entire module
export type mainExportType<T> = T extends {
  default: infer R;
}
  ? R
  : RequireOnlyOne<T> extends never
  ? T
  : RequireOnlyOne<T>;

// type mainExportTypeModule = mainExportType<typeof __typecellMyModule>;
// type pluginsPossibleModule = possibleMethods<mainExportTypeModule>;

/* Tests:

case 1:
type exportType = mainExportType<{
  x: 4;
  default: string;
}>;

case 2:
type exportTypeSingle = mainExportType<{
  x: 4;
}>;

case 3:
type exportTypeMultiple = mainExportType<{
  x: 4;
  y: 3;
}>;
*/
