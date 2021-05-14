import Table from "@tiptap/extension-table";
import { ReactNodeViewRenderer } from "@tiptap/react";

import Block from "./Block";

const TableBlock = Table.extend({
  draggable: true,

  // Used for rendering a React component inside the node, i.e. to add a drag handle to it.
  addNodeView() {
    return ReactNodeViewRenderer(Block("table"));
  },
});

export default TableBlock;
