import Paragraph from "@tiptap/extension-paragraph";
import { ReactNodeViewRenderer } from "@tiptap/react";
import Block from "./Block";

// Extends paragraphs to make them draggable and give them drag handles.
const ParagraphBlock = Paragraph.extend({
  // draggable: true,
  // selectable: false,

  // Used for rendering a React component inside the node, i.e. to add a drag handle to it.
  addNodeView() {
    return ReactNodeViewRenderer(Block("p"));
  },

  addKeyboardShortcuts() {
    return {
      // Enter: () => this.editor.commands.splitListItem("listItem"),
      // Tab: () => this.editor.commands.sinkBlock("paragraph"),
      // "Shift-Tab": () => this.editor.commands.liftListItem("paragraph"),
    };
  },
});

export default ParagraphBlock;
