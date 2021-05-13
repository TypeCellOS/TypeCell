import Tippy from "@tippyjs/react";
import Paragraph from "@tiptap/extension-paragraph";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { observer } from "mobx-react-lite";
import React from "react";
import SideMenu from "../../SideMenu";

import styles from "./Block.module.css";

// React component which adds a drag handle to the node.
const Component: React.FC<NodeViewRendererProps> = observer((props) => {
  function onDelete() {
    if (typeof props.getPos === "boolean") {
      throw new Error("unexpected");
    }
    const pos = props.getPos();

    props.editor.commands.deleteRange({
      from: pos,
      to: pos + props.node.nodeSize,
    });
  }

  if (typeof props.getPos !== "boolean") {
    const parent = props.editor.state.doc.resolve(props.getPos()).parent;
    if (parent.type.name !== "doc") {
      console.log(`not top level, without handle`);
      return (
        <NodeViewWrapper>
          <NodeViewContent as={"p"}></NodeViewContent>
        </NodeViewWrapper>
      );
    }
  }

  return (
    <NodeViewWrapper className="block">
      <Tippy
        content={<SideMenu onDelete={onDelete}></SideMenu>}
        trigger={"click"}
        placement={"left"}
        interactive={true}>
        <div
          className={styles.handle}
          contentEditable="false"
          draggable="true"
          data-drag-handle
        />
      </Tippy>
      <NodeViewContent className={styles.content} as={"p"} />
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
