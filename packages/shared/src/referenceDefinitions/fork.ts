import { createManyToOneReferenceDefinition } from "../Ref.js";

export const ForkReference = createManyToOneReferenceDefinition(
  "typecell",
  "forkOf",
);
