import Table from "@tiptap/extension-table";

import { extendAsBlock } from ".";
import tableStyles from "./TableBlock.module.css";

export const TableBlock = extendAsBlock(
  Table.configure({
    HTMLAttributes: tableStyles,
  })
);
