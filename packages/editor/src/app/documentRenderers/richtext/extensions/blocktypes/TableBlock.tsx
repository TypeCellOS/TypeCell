import Table from "@tiptap/extension-table";

import { extendAsBlock } from ".";
import tableStyles from "./TableBlock.module.css";

// TableBlock is different from other blocks because it needs additional styles for TableCell, TableRow etc.
// The styles(simple margin/paddings, table border, and cell width) are adapted from https://www.tiptap.dev/examples/tables
// More elaborate styles can be added to TableBlock.module.css.
export const TableBlock = extendAsBlock(
  Table.configure({
    HTMLAttributes: tableStyles,
  })
);
