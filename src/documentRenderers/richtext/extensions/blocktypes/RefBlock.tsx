import Tippy from "@tippyjs/react";
import BlockQuote from "@tiptap/extension-blockquote";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { observer } from "mobx-react-lite";
import { Command, Node, mergeAttributes } from "@tiptap/core";
import React from "react";
import SideMenu from "../../SideMenu";

import styles from "./Block.module.css";

// React component which adds a drag handle to the node.
const Component: React.FC<NodeViewRendererProps> = (props) => {
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

  return (
    <NodeViewWrapper className="block">
      <Tippy
        content={<SideMenu onDelete={onDelete}></SideMenu>}
        trigger={"click"}
        placement={"left"}
        interactive={true}>
        <div
          className={styles.handle}
          style={{ margin: 0.4 }}
          contentEditable="false"
          draggable="true"
          data-drag-handle
        />
      </Tippy>
      <NodeViewContent className={styles.content} />
    </NodeViewWrapper>
  );
};

export const RefBlock = Node.create<{}>({
  name: "ref",

  defaultOptions: {
    HTMLAttributes: {},
  },

  content: "block?",

  group: "block",

  defining: true,
  draggable: true,

  parseHTML() {
    return [{ tag: "ref" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["ref", HTMLAttributes, 0];
  },

  // Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});

export default RefBlock;
