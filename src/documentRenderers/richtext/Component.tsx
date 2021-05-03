import React from "react";
import {observer} from "mobx-react-lite";
import {DocumentResource} from "../../store/DocumentResource";
import {NodeViewContent, NodeViewWrapper } from "@tiptap/react";

type Props = {
  document: DocumentResource;
};

const Component: React.FC<Props> = observer((props) => {
  return(
    <NodeViewWrapper className={"draggable-item"}>
    <span contentEditable={false} draggable={true}>::</span>
      <NodeViewContent/>
    </NodeViewWrapper>
  );
})

export default Component;