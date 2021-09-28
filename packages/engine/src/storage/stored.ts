export type Stored = any;

export const StoredSymbol = Symbol("stored");
/* debate:

export x = store({});

vs. const x = stored("x", {})
*/
export function stored(value: any) {
  return {
    [StoredSymbol]: true,
    get() {
      return value;
    },
    [Symbol.toPrimitive](hint: any) {
      return value;
    },
  };
}

export function isStored(value: any): value is ReturnType<typeof stored> {
  return typeof value === "object" && value[StoredSymbol];
}
