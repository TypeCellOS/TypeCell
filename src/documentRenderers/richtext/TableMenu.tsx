import { Editor } from "@tiptap/react";
import React from "react";
import "tippy.js/themes/material.css";
import "tippy.js/dist/tippy.css";
import {
  AiOutlineInsertRowAbove,
  AiOutlineInsertRowBelow,
  AiOutlineDeleteRow,
  AiOutlineInsertRowLeft,
  AiOutlineInsertRowRight,
  AiOutlineDeleteColumn,
} from "react-icons/ai";
import { CgFormatHeading } from "react-icons/cg";

import tableStyles from "./TableMenu.module.css";
import { TableBubbleMenu } from "./extensions/table/TableBubbleMenu";

type TableMenuProps = { editor: Editor };

// This component is invoked only when a cursor is inside a TableCell, otherwise hidden
class TableMenu extends React.Component<TableMenuProps> {
  render() {
    const TOP_DEPTH = 1;

    const resolvedPos = this.props.editor.state.doc.resolve(
      this.props.editor.state.selection.from
    );

    // If the cursor is inside another node
    if (resolvedPos.depth > TOP_DEPTH) {
      const grandParent = resolvedPos.node(resolvedPos.depth - 1);

      // if grandParent node is of types that belong to tables
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
              <div className={tableStyles.optionIcon}>
                <AiOutlineInsertRowAbove></AiOutlineInsertRowAbove>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addRowAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addRowAfter().run()
              }>
              <div className={tableStyles.optionIcon}>
                <AiOutlineInsertRowBelow></AiOutlineInsertRowBelow>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteRow()}
              onClick={() =>
                this.props.editor.chain().focus().deleteRow().run()
              }>
              <div className={tableStyles.optionIcon}>
                <AiOutlineDeleteRow></AiOutlineDeleteRow>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addColumnBefore()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnBefore().run()
              }>
              <div className={tableStyles.optionIcon}>
                <AiOutlineInsertRowLeft></AiOutlineInsertRowLeft>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addColumnAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnAfter().run()
              }>
              <div className={tableStyles.optionIcon}>
                <AiOutlineInsertRowRight></AiOutlineInsertRowRight>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteColumn()}
              onClick={() =>
                this.props.editor.chain().focus().deleteColumn().run()
              }>
              <div className={tableStyles.optionIcon}>
                <AiOutlineDeleteColumn></AiOutlineDeleteColumn>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().toggleHeaderRow()}
              onClick={() =>
                this.props.editor.chain().focus().toggleHeaderRow().run()
              }>
              <div className={tableStyles.optionIcon}>
                <CgFormatHeading></CgFormatHeading>
              </div>
            </button>
          </TableBubbleMenu>
        );
      }
    }

    return <TableBubbleMenu className={"hidden"} editor={this.props.editor} />;
  }
}

export default TableMenu;
