import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import Tippy from "@tippyjs/react";
import {
  NodeViewContent,
  NodeViewRendererProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import React from "react";
import { Editor } from "@tiptap/core";

import SideMenu from "../../SideMenu";
import styles from "./Block.module.css";
import tableStyles from "./Table.module.css";

type TableMenuProps = { editor: Editor };

// React component for the menu bar for functions related to tables.
const TableMenu: React.FC<TableMenuProps> = (props) => {
  console.log(`table menu triggered`);
  return (
    <div className={tableStyles.TableMenu}>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor?.chain().focus().addRowBefore().run()}>
        AddRowBefore
      </button>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor?.chain().focus().addRowAfter().run()}>
        AddRowAfter
      </button>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor.chain().focus().deleteRow().run()}>
        DeleteRow
      </button>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor.chain().focus().addColumnBefore().run()}>
        AddColBefore
      </button>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor.chain().focus().addColumnAfter().run()}>
        AddColAfter
      </button>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor.chain().focus().deleteColumn().run()}>
        DeleteCol
      </button>
      <button
        className={tableStyles.tableMenuOption}
        onClick={() => props.editor.chain().focus().deleteTable().run()}>
        DeleteTable
      </button>
    </div>
  );
};

// React component which adds a drag handle to the node. Note how the NodeViewContent is rendered with an custom attribute.
const TableComponent: React.FC<NodeViewRendererProps> = (props) => {
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
    <NodeViewWrapper className={"block"}>
      <Tippy
        content={<SideMenu onDelete={onDelete}></SideMenu>}
        trigger={"click"}
        placement={"left"}
        interactive={true}>
        <div
          className={styles.handle}
          contentEditable="false"
          draggable="true"
          data-drag-handle></div>
      </Tippy>
      <NodeViewContent
        data-block-table
        className={styles.content}></NodeViewContent>
    </NodeViewWrapper>
  );
};

// Extends Tables to make them draggable and give them drag handles.
const CustomTable = Table.extend({
  draggable: true,

  // Used for rendering a React component inside the node. Here it's just used to add a drag handle to each block.
  addNodeView() {
    return ReactNodeViewRenderer(TableComponent);
  },
});

export default CustomTable;
export { TableMenu };
