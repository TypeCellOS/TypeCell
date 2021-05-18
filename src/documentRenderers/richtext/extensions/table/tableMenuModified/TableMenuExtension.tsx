import { Extension } from "@tiptap/core";
import {
  TableBubbleMenuPlugin,
  TableBubbleMenuPluginProps,
} from "./TableMenuPlugin";

// Code adapted from https://github.com/ueberdosis/tiptap/blob/7bf4c1d11ce4c36ad2846c4a15491ef8b649280d/packages/extension-bubble-menu/src/bubble-menu.ts
// This code is meant to show the menu when no text is selected, only names are changed.
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
