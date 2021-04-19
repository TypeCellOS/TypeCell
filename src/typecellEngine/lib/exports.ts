import DocumentView from "../../documentRenderers/DocumentView";
import { DocConnection } from "../../store/DocConnection";
import { createOneToManyReferenceDefinition } from "../../store/Ref";
import routing from "./routing";

// TODO: make sure only relevant types are exported
export function getExposeGlobalVariables(id: string) {
  return {
    typecell: {
      routing,
      DocumentView,
      namespace: id, // TODO: naming
      open: (identifier: string | { owner: string; document: string }) => {
        return DocConnection.load(identifier);
      },
      createOneToManyReferenceDefinition: (
        type: string,
        reverseType: string,
        sorted: boolean
      ) => {
        return createOneToManyReferenceDefinition(
          id,
          type,
          reverseType,
          sorted
        );
      },
    },
  };
}
