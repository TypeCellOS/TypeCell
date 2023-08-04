/* eslint-disable @typescript-eslint/no-explicit-any */
import { autorun, observable } from "mobx";

export type View = any;

export const ViewSymbol = Symbol("view");

export function view(view: any, value: any) {
  const ret = observable({
    [ViewSymbol]: true,
    view: undefined,
    value: undefined,
  });

  // TODO: cleanup
  autorun(() => (ret.view = view()));
  autorun(() => {
    ret.value = value();
  });
  return ret;
}

export function isView(value: any): value is ReturnType<typeof view> {
  return typeof value === "object" && value[ViewSymbol];
}
