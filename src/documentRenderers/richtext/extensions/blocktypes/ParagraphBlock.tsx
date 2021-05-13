import Paragraph from "@tiptap/extension-paragraph";
import {
  ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import Block from "./Block";

// Extends paragraphs to make them draggable and give them drag handles.
const ParagraphBlock = Paragraph.extend({
  draggable: true,

  // Used for rendering a React component inside the node, i.e. to add a drag handle to it.
  addNodeView() {
    return ReactNodeViewRenderer(Block("p"));
  },
});

export default ParagraphBlock;