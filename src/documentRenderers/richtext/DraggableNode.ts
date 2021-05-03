import {mergeAttributes, Node, ReactNodeViewRenderer} from "@tiptap/react"
import Component from "./Component";

const DraggableNode = Node.create({
  name: "draggableItem",
  group: "block",
  content: "block*",
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[class="draggable-item"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'class': 'draggable-item' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  }
})

export default DraggableNode;