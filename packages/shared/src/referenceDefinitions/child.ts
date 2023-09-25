import { createManyToManyReferenceDefinition } from "../Ref.js";

export const ChildReference = createManyToManyReferenceDefinition(
  "typecell",
  "hasChild",
  true,
);
