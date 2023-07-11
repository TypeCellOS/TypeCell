import { createOneToManyReferenceDefinition } from "../Ref";

export const ForkReference = createOneToManyReferenceDefinition(
  "typecell",
  "forkOf"
);
