import { Node } from "@tiptap/core";

export const TypeCellNode = Node.create({
  // configuration …
  name: "typecell",
  group: "block",

  // NOTE: probably something wrong with this configuration?
  content: "text*",
  //    content: 'inline*', al
  defining: true,
  atom: true,
  isolating: true,
  // The node view is added in ../blocktypes/index.ts
  // addNodeView() {
  //   return ReactNodeViewRenderer(TypeCellComponent);
  // },

  parseHTML() {
    return [{ tag: "div" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});
