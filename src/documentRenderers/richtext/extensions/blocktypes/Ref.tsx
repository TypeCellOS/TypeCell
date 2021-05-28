import { Node } from "@tiptap/core";

export const Ref = Node.create<{}>({
  name: "ref",

  defaultOptions: {
    HTMLAttributes: {
      style: {
        background: "yellow",
      },
    },
  },

  addAttributes() {
    return {
      documentId: {
        default: null,
        rendered: false,
      },
      blockId: {
        default: null,
        rendered: false,
      },
      ...this.parent?.(),
    };
  },

  content: "block?",

  group: "block",

  defining: true,
  draggable: true,

  parseHTML() {
    return [{ tag: "div" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
});

export default Ref;
