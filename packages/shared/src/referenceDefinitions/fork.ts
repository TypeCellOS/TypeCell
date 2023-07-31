import { createManyToOneReferenceDefinition } from "../Ref";

export const ForkReference = createManyToOneReferenceDefinition(
  "typecell",
  "forkOf"
);
