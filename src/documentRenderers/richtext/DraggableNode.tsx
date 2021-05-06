import {mergeAttributes, Node, ReactNodeViewRenderer} from "@tiptap/react"
import React from "react";
import {observer} from "mobx-react-lite";
import {DocumentResource} from "../../store/DocumentResource";
import {NodeViewContent, NodeViewWrapper } from "@tiptap/react";

type Props = {
  document: DocumentResource;
};

// React component used to structure draggable blocks.
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

// Wrapper to create draggable blocks with a drag handle.
const Draggable = Node.create({
  name: "draggable",
  group: "block",
  content: "block*",
  draggable: true,

  // False means that empty blocks are deleted on backspace, but true means that space between blocks can be selected.
  isolating: false,

  parseHTML() {
    return [
      {
        tag: 'draggable',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['draggable', mergeAttributes(HTMLAttributes)];
  },

  // Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
  addNodeView() {
    return ReactNodeViewRenderer(Component);
  }
})

export default Draggable;