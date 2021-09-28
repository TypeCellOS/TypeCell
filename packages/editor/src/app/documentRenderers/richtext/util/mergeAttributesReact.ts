import { mergeAttributes } from "@tiptap/core";

export default function mergeAttributesReact(
  ...objects: Record<string, any>[]
): Record<string, any> {
  const ret = mergeAttributes(...objects);
  if (ret.class) {
    // react uses className instead of class
    ret.className = ret.class;
    delete ret.class;
  }
  return ret;
}
