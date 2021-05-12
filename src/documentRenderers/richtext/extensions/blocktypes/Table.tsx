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
import SideMenu from "../../SideMenu";
import styles from "./Block.module.css";
import tableStyles from "./Table.module.css";

import { Editor } from "@tiptap/core";

type TableMenuProps = { editor: Editor };

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
        onClick={() => props.editor.chain().focus().deleteTable().run()}>
        DeleteTable
      </button>
    </div>
  );
};

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
    <NodeViewWrapper>
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
      <Tippy
        content={<TableMenu editor={props.editor}></TableMenu>}
        placement={"top"}
        interactive={true}
        trigger={"mouseenter focus focusin"}>
        <div>
          <NodeViewContent as={"table"}></NodeViewContent>
        </div>
      </Tippy>
    </NodeViewWrapper>
  );
};

const CustomTable = Table.extend({
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(TableComponent);
  },
});
export default CustomTable;
