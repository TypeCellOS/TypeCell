import {mergeAttributes, Node, ReactNodeViewRenderer} from "@tiptap/react"
import React from "react";
import {observer} from "mobx-react-lite";
import {DocumentResource} from "../../store/DocumentResource";
import {NodeViewContent, NodeViewWrapper } from "@tiptap/react";

type Props = {
  document: DocumentResource;
};

const Component: React.FC<Props> = observer((props) => {
  return(
    <NodeViewWrapper className="draggable-item">
      <div
        className="drag-handle"
        contentEditable="false"
        draggable="true"
        data-drag-handle
    />
    <NodeViewContent className="content"/>
  </NodeViewWrapper>
);
})

const DraggableNode = Node.create({
  name: "draggableItem",
  group: "block",
  content: "block*",
  isolating: true,
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