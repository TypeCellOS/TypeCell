// export type Setting<T extends number | string | boolean> =
//   | {
//       codeValue: string;
//       value: T;
//     }
//   | undefined;

export type Settings = {
  [key: string]: string | undefined;
};
