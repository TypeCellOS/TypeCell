import { Extension } from "@tiptap/core";
import { CreateDraggableBlocksPlugin } from "./DraggableBlocksPlugin";

export const DraggableBlocksExtension = Extension.create<{}>({
  name: "draggable-blocks",

  addProseMirrorPlugins() {
    return [CreateDraggableBlocksPlugin()];
  },
});
