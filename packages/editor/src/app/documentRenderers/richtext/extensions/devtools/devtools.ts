import { Extension } from "@tiptap/core";
let applyDevTools = require("prosemirror-dev-tools").applyDevTools;

export const DevTools = Extension.create<{}>({
  name: "DevTools",

  defaultOptions: {},

  addProseMirrorPlugins() {
    applyDevTools(this.editor.view);
    return [];
  },
});
