import { createManyToOneReferenceDefinition } from "../Ref.js";

export const IndexFileReference = createManyToOneReferenceDefinition(
  "typecell",
  "hasIndexFile",
);
