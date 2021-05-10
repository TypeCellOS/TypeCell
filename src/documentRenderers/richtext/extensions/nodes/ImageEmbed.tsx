import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { Command, Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import "./ImageEmbed.module.css";

export const ImageEmbed = Image.extend({
  inline: false,
  atom: true,

  // Code of Slava Vishnyakov
  // https://gist.github.com/slava-vishnyakov/16076dff1a77ddaca93c4bccd4ec4521
  addPasteRules() {
    const setImage: Function = this.editor.commands.setImage;
    return [
      new Plugin({
        key: new PluginKey("imagePasteRule"),
        props: {
          handlePaste(view, event: ClipboardEvent, slice) {
            const items = event.clipboardData?.items;
            if (items == undefined) return false;
            for (const item of items) {
              if (item.type.indexOf("image") === 0) {
                event.preventDefault();
                const { schema } = view.state;

                const image = item.getAsFile();
                if (image === null) return false;

                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                  const node = schema.nodes.image.create({
                    src: readerEvent.target?.result,
                  });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction.scrollIntoView());
                };
                reader.readAsDataURL(image);
              }
            }
            return false;
          },
          handleDOMEvents: {
            drop(view, event) {
              const hasFiles =
                event.dataTransfer &&
                event.dataTransfer.files &&
                event.dataTransfer.files.length;

              if (!hasFiles) {
                return false;
              }

              const images = Array.from(
                event.dataTransfer!.files
              ).filter((file) => /image/i.test(file.type));

              if (images.length === 0) {
                return false;
              }

              event.preventDefault();

              const { schema } = view.state;
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (coordinates == (null || undefined)) return false;

              images.forEach(async (image) => {
                const reader = new FileReader();

                reader.onload = (readerEvent) => {
                  const node = schema.nodes.image.create({
                    src: readerEvent.target?.result,
                  });
                  const transaction = view.state.tr.insert(
                    coordinates.pos,
                    node
                  );
                  view.dispatch(transaction);
                };
                reader.readAsDataURL(image);
              });
              return true;
            },
          },
        },
      }),
    ];
  },
});
