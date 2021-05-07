import React from "react";
import { ReactNodeViewRenderer, NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import Paragraph from "@tiptap/extension-paragraph";

import { observer } from "mobx-react-lite";
import { DocumentResource } from "../../store/DocumentResource";

type Props = {
  document: DocumentResource;
};

// React component which adds a drag handle to the node.
const Component: React.FC<Props> = observer((props) => {
  return(
    <NodeViewWrapper className="block">
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

// Extends paragraphs to make them draggable and give them drag handles.
const ParagraphBlock = Paragraph.extend({
  draggable: true,

  // Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
  addNodeView() {
    return ReactNodeViewRenderer(Component);
  }
})

export default ParagraphBlock;