import { Node } from "@tiptap/core";

export const DocumentTopNode = Node.create({
  name: "doc",
  topNode: true,
  content: "block+",
});
