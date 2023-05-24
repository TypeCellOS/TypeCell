import { createManyToManyReferenceDefinition } from "../Ref";

export const ChildReference = createManyToManyReferenceDefinition(
  "typecell",
  "childOf",
  true
);
