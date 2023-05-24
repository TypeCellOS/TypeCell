import { createOneToManyReferenceDefinition } from "../Ref";

export const ChildReference = createOneToManyReferenceDefinition(
  "typecell",
  "forkOf"
);
