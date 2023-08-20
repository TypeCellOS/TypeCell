import { createManyToOneReferenceDefinition } from "../Ref";

export const IndexFileReference = createManyToOneReferenceDefinition(
  "typecell",
  "hasIndexFile"
);
