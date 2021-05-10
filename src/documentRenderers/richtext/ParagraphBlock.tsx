import React from "react";
import {
  ReactNodeViewRenderer,
  NodeViewContent,
  NodeViewWrapper,
} from "@tiptap/react";
import Paragraph from "@tiptap/extension-paragraph";

import { observer } from "mobx-react-lite";
import { DocumentResource } from "../../store/DocumentResource";
import SideMenu from "./SideMenu";

type Props = {
  document: DocumentResource;
};

// React component which adds a drag handle to the node.
const Component: React.FC<Props> = observer((props) => {
  return (
    <NodeViewWrapper className="block">
      <div
        className="drag-handle"
        contentEditable="false"
        draggable="true"
        data-drag-handle
        onClick={(event) => {
          console.log(`clicked`);
          const menu = event.currentTarget.nextSibling;
          if (!menu) {
            window.alert("menu unavailable");
            return;
          }
          // @ts-ignore
          const shown: boolean = !(menu.style.display === "none");
          if (shown) {
            // @ts-ignore
            menu.style.display = "none";
          } else {
            const rect = event.currentTarget.getBoundingClientRect();
            // @ts-ignore
            menu.style.left = `${-999}px`;
            // @ts-ignore
            menu.style.display = "block";
            // @ts-ignore
            menu.style.left = `calc(${-menu.scrollWidth}px - 1em)`;
            // @ts-ignore
            menu.style.top = `${
              window.pageYOffset +
              (rect.top + rect.bottom) / 2 -
              // @ts-ignore
              menu.scrollHeight / 2
            }px`;
          }
        }}
      />
      <SideMenu></SideMenu>
      <NodeViewContent className="content" />
    </NodeViewWrapper>
  );
});

// Extends paragraphs to make them draggable and give them drag handles.
const ParagraphBlock = Paragraph.extend({
  draggable: true,

  // Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});

export default ParagraphBlock;
