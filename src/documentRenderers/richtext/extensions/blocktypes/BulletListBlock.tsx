import BulletList from "@tiptap/extension-bullet-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends bullet lists to make them draggable and give them drag handles.
const BulletListBlock = BulletList.extend({
  draggable: true,
  selectable: false,

  // Used for rendering a React component inside the node, i.e. to add a drag handle to it.
  // addNodeView() {
  // 	return ReactNodeViewRenderer(Block("ul"));
  // }
});

export default BulletListBlock;
