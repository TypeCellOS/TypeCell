import React, { useEffect, useRef } from "react";
import {
  TableBubbleMenuPluginProps,
  TableBubbleMenuPlugin,
  TableBubbleMenuPluginKey,
} from "./modifiedBubbleMenuPlugin/TableMenuPlugin";

// Code adapted from https://github.com/ueberdosis/tiptap/blob/main/packages/react/src/BubbleMenu.tsx
// This is needed to provide a BubbleMenu that can be activated without selecting text.
export type TableBubbleMenuProps = Omit<
  TableBubbleMenuPluginProps,
  "element"
> & {
  className?: string;
};

/**
 * This is needed to actually register the plugin to the editor and create the TableMenu
 * @param props of TableBubbleMenuProps
 * @returns a component of TableBubbleMenu
 */
export const TableBubbleMenu: React.FC<TableBubbleMenuProps> = (props) => {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { editor, tippyOptions } = props;

    editor.registerPlugin(
      TableBubbleMenuPlugin({
        editor,
        element: element.current as HTMLElement,
        tippyOptions,
      })
    );

    return () => {
      editor.unregisterPlugin(TableBubbleMenuPluginKey);
    };
  }, []);

  return (
    <div
      ref={element}
      className={props.className}
      style={{ visibility: "hidden" }}>
      {props.children}
    </div>
  );
};
