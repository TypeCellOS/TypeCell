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
    <NodeViewWrapper className="boundary">
      <NodeViewContent/>
    </NodeViewWrapper>
);
})

const BoundaryNode = Node.create({
  name: "boundary",
  group: "block",
  content: "block*",
  selectable: false,
  atom: true,
  isolating: true,

  parseHTML() {
    return [
      {
        tag: 'div[class="boundary"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'class': 'boundary' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  }
})

export default BoundaryNode;