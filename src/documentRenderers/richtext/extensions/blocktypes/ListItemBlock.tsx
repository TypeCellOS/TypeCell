import ListItem from "@tiptap/extension-list-item";
import { ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends list items to make them draggable and give them drag handles.
const ListItemBlock = ListItem.extend({
  draggable: true,
  selectable: false,
  content: "plainblock*",
  // Used for rendering a React component inside the node, i.e. to add a drag handle to it.
  addNodeView() {
    return ReactNodeViewRenderer(Block("li"));
  },
});

export default ListItemBlock;
