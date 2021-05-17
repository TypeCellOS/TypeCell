import { Editor } from "@tiptap/react";
import React from "react";
import "tippy.js/themes/material.css";
import "tippy.js/dist/tippy.css";

import tableStyles from "./extensions/blocktypes/Table.module.css";
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
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0H24V24H0z"></path>
                    <path d="M20 13c.552 0 1 .448 1 1v6c0 .552-.448 1-1 1H4c-.552 0-1-.448-1-1v-6c0-.552.448-1 1-1h16zm-1 2H5v4h14v-4zM12 1c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5zm1 2h-2v1.999L9 5v2l2-.001V9h2V6.999L15 7V5l-2-.001V3z"></path>
                  </g>
                </svg>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addRowAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addRowAfter().run()
              }>
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0H24V24H0z"></path>
                    <path d="M12 13c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5zm1 2h-2v1.999L9 17v2l2-.001V21h2v-2.001L15 19v-2l-2-.001V15zm7-12c.552 0 1 .448 1 1v6c0 .552-.448 1-1 1H4c-.552 0-1-.448-1-1V4c0-.552.448-1 1-1h16zM5 5v4h14V5H5z"></path>
                  </g>
                </svg>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteRow()}
              onClick={() =>
                this.props.editor.chain().focus().deleteRow().run()
              }>
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0H24V24H0z"></path>
                    <path d="M20 5c.552 0 1 .448 1 1v6c0 .552-.448 1-1 1 .628.835 1 1.874 1 3 0 2.761-2.239 5-5 5s-5-2.239-5-5c0-1.126.372-2.165 1-3H4c-.552 0-1-.448-1-1V6c0-.552.448-1 1-1h16zm-7 10v2h6v-2h-6zm6-8H5v4h14V7z"></path>
                  </g>
                </svg>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addColumnBefore()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnBefore().run()
              }>
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0H24V24H0z"></path>
                    <path d="M20 3c.552 0 1 .448 1 1v16c0 .552-.448 1-1 1h-6c-.552 0-1-.448-1-1V4c0-.552.448-1 1-1h6zm-1 2h-4v14h4V5zM6 7c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5zm1 2H5v1.999L3 11v2l2-.001V15h2v-2.001L9 13v-2l-2-.001V9z"></path>
                  </g>
                </svg>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().addColumnAfter()}
              onClick={() =>
                this.props.editor.chain().focus().addColumnAfter().run()
              }>
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0H24V24H0z"></path>
                    <path d="M10 3c.552 0 1 .448 1 1v16c0 .552-.448 1-1 1H4c-.552 0-1-.448-1-1V4c0-.552.448-1 1-1h6zM9 5H5v14h4V5zm9 2c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5zm1 2h-2v1.999L15 11v2l2-.001V15h2v-2.001L21 13v-2l-2-.001V9z"></path>
                  </g>
                </svg>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().deleteColumn()}
              onClick={() =>
                this.props.editor.chain().focus().deleteColumn().run()
              }>
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0H24V24H0z"></path>
                    <path d="M12 3c.552 0 1 .448 1 1v8c.835-.628 1.874-1 3-1 2.761 0 5 2.239 5 5s-2.239 5-5 5c-1.032 0-1.99-.313-2.787-.848L13 20c0 .552-.448 1-1 1H6c-.552 0-1-.448-1-1V4c0-.552.448-1 1-1h6zm-1 2H7v14h4V5zm8 10h-6v2h6v-2z"></path>
                  </g>
                </svg>
              </div>
            </button>
            <button
              className={tableStyles.tableMenuOption}
              disabled={!this.props.editor.can().toggleHeaderRow()}
              onClick={() =>
                this.props.editor.chain().focus().toggleHeaderRow().run()
              }>
              <div>
                <svg
                  className={tableStyles.optionIcon}
                  stroke="currentColor"
                  fill="currentColor"
                  stroke-width="0"
                  viewBox="0 0 24 24"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path d="M17 11V4h2v17h-2v-8H7v8H5V4h2v7z"></path>
                  </g>
                </svg>
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
