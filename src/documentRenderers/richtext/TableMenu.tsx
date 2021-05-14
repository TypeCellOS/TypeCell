import { Editor } from "@tiptap/react";
import { Selection, NodeSelection } from "prosemirror-state";
import React, { MouseEventHandler } from "react";
import styles from "./InlineMenu.module.css";
import Tippy from "@tippyjs/react";
import "tippy.js/themes/material.css";
import "tippy.js/dist/tippy.css";

import tableStyles from "./extensions/blocktypes/Table.module.css";
import { TableBubbleMenu } from "./extensions/table/TableBubbleMenu";

type TableMenuProps = { editor: Editor };

class TableMenu extends React.Component<TableMenuProps> {
  render() {
    const TOP_DEPTH = 1;

    const resolvedPos = this.props.editor.state.doc.resolve(
      this.props.editor.state.selection.from
    );

    if (resolvedPos.depth > TOP_DEPTH) {
      const grandParent = resolvedPos.node(resolvedPos.depth - 1);

      if (
        grandParent &&
        grandParent.type.name.toLowerCase().startsWith("table")
      ) {
        return (
          <TableBubbleMenu
            className={tableStyles.TableMenu}
            editor={this.props.editor}>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addRowBefore()}
              onClick={() =>
                this.props.editor.chain().focus().addRowBefore().run()
              }>
              AddRowBefore
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addRowAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addRowAfter().run()
              }>
              AddRowAfter
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteRow()}
              onClick={() =>
                this.props.editor.chain().focus().deleteRow().run()
              }>
              DeleteRow
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addColumnBefore()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnBefore().run()
              }>
              AddColBefore
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addColumnAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnAfter().run()
              }>
              AddColAfter
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteColumn()}
              onClick={() =>
                this.props.editor.chain().focus().deleteColumn().run()
              }>
              DeleteCol
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().toggleHeaderRow()}
              onClick={() =>
                this.props.editor.chain().focus().toggleHeaderRow().run()
              }>
              ToggleHeaderRow
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().toggleHeaderColumn()}
              onClick={() =>
                this.props.editor.chain().focus().toggleHeaderColumn().run()
              }>
              ToggleHeaderCol
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteTable()}
              onClick={() =>
                this.props.editor.chain().focus().deleteTable().run()
              }>
              DeleteTable
            </button>
          </TableBubbleMenu>
        );
      }
    }

    return (
      <TableBubbleMenu className={styles.hidden} editor={this.props.editor} />
    );
  }
}

export default TableMenu;
