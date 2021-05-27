import { Editor } from "@tiptap/react";
import React from "react";
import InsertColumnLeftIcon from "remixicon-react/InsertColumnLeftIcon";
import InsertColumnRightIcon from "remixicon-react/InsertColumnRightIcon";
import InsertRowBottomIcon from "remixicon-react/InsertRowBottomIcon";
import InsertRowTopIcon from "remixicon-react/InsertRowTopIcon";
import DeleteColumnIcon from "remixicon-react/DeleteColumnIcon";
import DeleteRowIcon from "remixicon-react/DeleteRowIcon";

import { TableBubbleMenu } from "../extensions/table/TableBubbleMenu";
import BubbleMenuButton, { ButtonStyleDetails } from "./BubbleMenuButton";
import styles from "./InlineMenu.module.css";

type TableMenuProps = { editor: Editor };

const addRowBefore: ButtonStyleDetails = {
  mainTooltip: "Insert row above the selection",
  icon: InsertRowTopIcon,
};

const addRowAfter: ButtonStyleDetails = {
  mainTooltip: "Insert row below the selection",
  icon: InsertRowBottomIcon,
};

const deleteRow: ButtonStyleDetails = {
  mainTooltip: "Delete selected row(s)",
  icon: DeleteRowIcon,
};

const addColumnBefore: ButtonStyleDetails = {
  mainTooltip: "Insert column left of the selection",
  icon: InsertColumnLeftIcon,
};

const addColumnAfter: ButtonStyleDetails = {
  mainTooltip: "Insert column right of the selection",
  icon: InsertColumnRightIcon,
};

const deleteColumn: ButtonStyleDetails = {
  mainTooltip: "Delete selected column(s)",
  icon: DeleteColumnIcon,
};

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
            className={styles.bubbleMenu}
            editor={this.props.editor}>
            <BubbleMenuButton
              styleDetails={addRowBefore}
              onClick={() =>
                this.props.editor.chain().focus().addRowBefore().run()
              }
            />
            <BubbleMenuButton
              styleDetails={addRowAfter}
              onClick={() =>
                this.props.editor.chain().focus().addRowAfter().run()
              }
            />
            <BubbleMenuButton
              styleDetails={deleteRow}
              onClick={() =>
                this.props.editor.chain().focus().deleteRow().run()
              }
            />
            <BubbleMenuButton
              styleDetails={addColumnBefore}
              onClick={() =>
                this.props.editor.chain().focus().addColumnBefore().run()
              }
            />
            <BubbleMenuButton
              styleDetails={addColumnAfter}
              onClick={() =>
                this.props.editor.chain().focus().addColumnAfter().run()
              }
            />
            <BubbleMenuButton
              styleDetails={deleteColumn}
              onClick={() =>
                this.props.editor.chain().focus().deleteColumn().run()
              }
            />
          </TableBubbleMenu>
        );
      }
    }
    // If not inside a table, don't show the TableBubbleMenu
    else
      return (
        <TableBubbleMenu className={"hidden"} editor={this.props.editor} />
      );
  }
}

export default TableMenu;
