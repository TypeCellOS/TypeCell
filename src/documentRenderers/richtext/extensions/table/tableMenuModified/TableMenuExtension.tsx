import { Extension } from "@tiptap/core";
import {
  TableBubbleMenuPlugin,
  TableBubbleMenuPluginProps,
} from "./TableMenuPlugin";

export type TableBubbleMenuOptions = Omit<
  TableBubbleMenuPluginProps,
  "editor" | "element"
> & {
  element: HTMLElement | null;
};

export const TableBubbleMenu = Extension.create<TableBubbleMenuOptions>({
  name: "tableBubbleMenu",

  defaultOptions: {
    element: null,
    tippyOptions: {},
  },

  addProseMirrorPlugins() {
    if (!this.options.element) {
      return [];
    }

    return [
      TableBubbleMenuPlugin({
        editor: this.editor,
        element: this.options.element,
        tippyOptions: this.options.tippyOptions,
      }),
    ];
  },
});
