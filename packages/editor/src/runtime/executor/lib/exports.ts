import { computed } from "mobx";
import { Input } from "./input/Input";
import { TCInput } from "./input/inputs/TCInput";

/**
 * This is used in ../resolver/resolver.ts and exposes the "typecell" helper functions
 * (e.g.: typecell.Input)
 */

export default function getExposeGlobalVariables(
  id: string,
  loadPlugins: (obj: any) => void
) {
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
    TCInput,
    TypeVisualizer,
    Block,
    loadPlugins,
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

export class Block<T> {
  // public readonly name: string;
  // public readonly function: (arg: T) => any;
  public readonly inputs: T[];
  constructor(
    public readonly name: string,
    public readonly obj: any,
    ...inputs: T[]
  ) {
    this.inputs = inputs;
  }
}
