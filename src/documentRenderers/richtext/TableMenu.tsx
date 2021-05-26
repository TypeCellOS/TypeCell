import { Editor } from "@tiptap/react";
import React from "react";
import {
  AiOutlineInsertRowAbove,
  AiOutlineInsertRowBelow,
  AiOutlineDeleteRow,
  AiOutlineInsertRowLeft,
  AiOutlineInsertRowRight,
  AiOutlineDeleteColumn,
} from "react-icons/ai";

import InsertColumnLeftIcon from "remixicon-react/InsertColumnLeftIcon";
import InsertColumnRightIcon from "remixicon-react/InsertColumnRightIcon";
import InsertRowBottomIcon from "remixicon-react/InsertRowBottomIcon";
import InsertRowTopIcon from "remixicon-react/InsertRowTopIcon";
import DeleteColumnIcon from "remixicon-react/DeleteColumnIcon";
import DeleteRowIcon from "remixicon-react/DeleteRowIcon";
import HeaderRowIcon from "remixicon-react/LayoutRowFillIcon";

import { CgFormatHeading } from "react-icons/cg";

import styles from "./TableMenu.module.css";
import { TableBubbleMenu } from "./extensions/table/TableBubbleMenu";
import { RemixiconReactIconComponentType } from "remixicon-react";
import Tippy from "@tippyjs/react";
import Button from "@atlaskit/button";
// import { BubbleMenuButton } from "./InlineMenu";

type TableMenuProps = { editor: Editor };
type MenuButtonProps = {
  // editor: Editor;
  styleDetails: StyleDetails;
  isDisabled: boolean;
  onClick: () => void;
};

type StyleDetails = {
  mainTooltip: string;
  secondaryTooltip?: string;
  icon: RemixiconReactIconComponentType;
  // icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
};

const addRowBefore: StyleDetails = {
  mainTooltip: "Insert row above the selection",
  icon: InsertRowTopIcon,
};

const addRowAfter: StyleDetails = {
  mainTooltip: "Insert row below the selection",
  icon: InsertRowBottomIcon,
};

const deleteRow: StyleDetails = {
  mainTooltip: "Delete selected row(s)",
  icon: DeleteRowIcon,
};

const addColumnBefore: StyleDetails = {
  mainTooltip: "Insert column left of the selection",
  icon: InsertColumnLeftIcon,
};

const addColumnAfter: StyleDetails = {
  mainTooltip: "Insert column right of the selection",
  icon: InsertColumnRightIcon,
};

const deleteColumn: StyleDetails = {
  mainTooltip: "Delete selected column(s)",
  icon: DeleteColumnIcon,
};

const toggleHeaderRow: StyleDetails = {
  mainTooltip: "Toggle this as a header row",
  icon: HeaderRowIcon,
};

const BubbleMenuButton = (props: MenuButtonProps) => {
  const tooltipContent = (
    <div className={styles.buttonTooltip}>
      <div className={styles.mainText}>{props.styleDetails.mainTooltip}</div>
      <div className={styles.secondaryText}>
        {props.styleDetails.secondaryTooltip}
      </div>
    </div>
  );

  // const name = props.styleDetails.name;
  // let isButtonSelected = () => props.editor.isActive(name);
  const ButtonIcon = props.styleDetails.icon;

  return (
    <Tippy content={tooltipContent}>
      <Button
        appearance="subtle"
        isDisabled={props.isDisabled}
        onClick={props.onClick}
        // isSelected={isButtonSelected()}
        iconBefore={
          ButtonIcon ? (
            <ButtonIcon
              className={
                styles.icon
                // +
                // " " +
                // (isButtonSelected() ? styles.isSelected : "")
              }
            />
          ) : undefined
        }
      />
    </Tippy>
  );
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
            className={styles.tableMenu}
            editor={this.props.editor}>
            <BubbleMenuButton
              styleDetails={addRowBefore}
              isDisabled={!this.props.editor.can().addRowBefore()}
              onClick={() =>
                this.props.editor.chain().focus().addRowBefore().run()
              }
            />
            <BubbleMenuButton
              styleDetails={addRowAfter}
              isDisabled={!this.props.editor.can().addRowAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addRowAfter().run()
              }
            />
            <BubbleMenuButton
              styleDetails={deleteRow}
              isDisabled={!this.props.editor.can().deleteRow()}
              onClick={() =>
                this.props.editor.chain().focus().deleteRow().run()
              }
            />
            <BubbleMenuButton
              styleDetails={addColumnBefore}
              isDisabled={!this.props.editor.can().addColumnBefore()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnBefore().run()
              }
            />
            <BubbleMenuButton
              styleDetails={addColumnAfter}
              isDisabled={!this.props.editor.can().addColumnAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnAfter().run()
              }
            />
            <BubbleMenuButton
              styleDetails={deleteColumn}
              isDisabled={!this.props.editor.can().deleteColumn()}
              onClick={() =>
                this.props.editor.chain().focus().deleteColumn().run()
              }
            />
            <BubbleMenuButton
              styleDetails={toggleHeaderRow}
              isDisabled={!this.props.editor.can().toggleHeaderRow()}
              onClick={() => {
                // Due to the parculiarity of ProseMirror, see: https://github.com/ProseMirror/prosemirror-tables/blob/6b16ed3cf306886f2c169aebbe60701e1ac2deac/src/commands.js#L438
                // We must select a TableCell to be able to toggle the entire row
                // But currently with ParagraphBlock any cursor selection lives inside a paragraph
                // A remedy is implemented as follows:

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
              }}
            />
          </TableBubbleMenu>
        );
      }
    }

    return <TableBubbleMenu className={"hidden"} editor={this.props.editor} />;
  }
}

export default TableMenu;
