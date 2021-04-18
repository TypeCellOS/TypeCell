import DocumentView from "../../documentRenderers/DocumentView";
import LoadingTCDocument from "../../store/LoadingTCDocument";
import { createOneToManyReferenceDefinition } from "../../store/Ref";
import routing from "../../util/routing";

// TODO: make sure only relevant types are exported
export function getExposeGlobalVariables(id: string) {
  return {
    typecell: {
      routing,
      DocumentView,
      namespace: id, // TODO: naming
      doc: (identifier: string | { owner: string; document: string }) => {
        return LoadingTCDocument.load(identifier);
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
