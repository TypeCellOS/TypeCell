import React from "react";
import { TableBubbleMenuPluginProps } from "./tableMenuModified/index";
export declare type TableBubbleMenuProps = Omit<
  TableBubbleMenuPluginProps,
  "element"
> & {
  className?: string;
};
export declare const TableBubbleMenu: React.FC<TableBubbleMenuProps>;
