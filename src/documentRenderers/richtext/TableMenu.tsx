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

/**
 * This component is an adapted version of inline menu. This menu will only show itself when the
 * cursor is inside a table block, providing functions specific to tables, such as inserting rows.
 * A normal bubble menu is hidden when there is no selection, i.e. selection is empty.
 * But this modified TableMenu CAN appear inside a tableCell even when there is NO selection of text.
 * By clicking again this TableMenu can disappear.
 * e.g. simply put the cursor in any table cell inside a table, a table menu will appear, where you may insert
 * another column to the right of this table cell in which your cursor is located.
 */
class TableMenu extends React.Component<TableMenuProps> {
  render() {
    // This depth is what a top-level block would have, any nested block has a larger value
    const TOP_DEPTH = 1;

    const resolvedPos = this.props.editor.state.doc.resolve(
      this.props.editor.state.selection.from
    );

    // If the cursor is inside another node, i.e. it is a nested block
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
              onClick={() => {
                // current depth where the text in a paragraph block is located
                const currentDepth = resolvedPos.depth;

                // We cannot acquire where the position of the start of this block is
                // So budge the cursor little by little until the depth changes
                // Which means this cursor position is right before <p>
                let shift;
                for (shift = 0; ; shift++) {
                  const newPos = this.props.editor.state.doc.resolve(
                    this.props.editor.state.selection.from - shift
                  );
                  if (newPos.depth !== currentDepth) {
                    break;
                  }
                }

                // This position (<td>|<p>text...</p>) will be used for selection of a TableCell selection
                this.props.editor.commands.setNodeSelection(
                  this.props.editor.state.selection.from - shift
                );

                this.props.editor.chain().focus().toggleHeaderRow().run();
              }}>
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
