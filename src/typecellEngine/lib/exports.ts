import DocumentView from "../../documentRenderers/DocumentView";
import { DocConnection } from "../../store/DocConnection";
import { createOneToManyReferenceDefinition } from "../../store/Ref";
import { isFalsyOrWhitespace } from "../../util/vscode-common/strings";
import routing from "./routing";
import Input from "./input/Input";

// TODO: make sure only relevant types are exported
export default function getExposeGlobalVariables(id: string) {
  return {
    routing,
    DocumentView,
    Input,
    namespace: id, // TODO: naming
    open: (identifier: string | { owner: string; document: string }) => {
      return DocConnection.load(identifier);
    },
    createOneToManyReferenceDefinition: (
      type: string,
      reverseType: string,
      sorted: boolean
    ) => {
      return createOneToManyReferenceDefinition(id, type, reverseType, sorted);
    },
    TypeVisualizer,
  };
}
export type TypeVisualizerArgs<T> = {
  name: string;
  function: (arg: T) => any;
};
export class TypeVisualizer<T> {
  constructor(public visualizer: TypeVisualizerArgs<T>) {
    if (
      isFalsyOrWhitespace(visualizer.name) ||
      typeof visualizer.function !== "function"
    ) {
      throw new Error("invalid args");
    }
  }
}
