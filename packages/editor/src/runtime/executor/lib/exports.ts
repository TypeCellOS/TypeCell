import { computed } from "mobx";
import { Input } from "./input/Input";

// TODO: make sure only relevant types are exported
export default function getExposeGlobalVariables(id: string) {
  return {
    // routing,
    // // DocumentView,
    Input,
    // namespace: id, // TODO: naming
    // open: (identifier: string | { owner: string; document: string }) => {
    //   return DocConnection.load(identifier);
    // },
    // createOneToManyReferenceDefinition: (
    //   type: string,
    //   reverseType: string,
    //   sorted: boolean
    // ) => {
    //   return createOneToManyReferenceDefinition(id, type, reverseType, sorted);
    // },
    TypeVisualizer,
    computed: computed as (func: () => any) => any,
  };
}
export class TypeVisualizer<T> {
  // public readonly name: string;
  // public readonly function: (arg: T) => any;

  constructor(
    public readonly func: (arg: T) => any,
    public readonly name?: string
  ) {
    if (
      // strings.isFalsyOrWhitespace(visualizer.name) ||
      typeof func !== "function"
    ) {
      throw new Error("invalid args");
    }
  }
}
