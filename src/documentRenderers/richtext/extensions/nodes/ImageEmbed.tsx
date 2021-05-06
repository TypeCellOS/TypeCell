import { Plugin, PluginKey } from "prosemirror-state";
import { Command, Node, nodeInputRule, mergeAttributes } from "@tiptap/core";

/**
 * Code copied from the TipTap source code
 * https://github.com/ueberdosis/tiptap/blob/main/packages/extension-image/src/image.ts
 */
export interface ImageOptions {
  inline: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands {
    image: {
      /**
       * Add an image
       */
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
      }) => Command;
    };
  }
}

export const inputRegex = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export const ImageEmbed = Node.create<ImageOptions>({
  name: "image",

  defaultOptions: {
    inline: false,
    HTMLAttributes: {},
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addInputRules() {
    return [
      nodeInputRule(inputRegex, this.type, (match) => {
        const [, alt, src, title] = match;

        return { src, alt, title };
      }),
    ];
  },

  // Code of Slava Vishnyakov
  // https://gist.github.com/slava-vishnyakov/16076dff1a77ddaca93c4bccd4ec4521
  addPasteRules() {
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
                if (image == null) return false;

                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                  const node = schema.nodes.image.create({
                    src: readerEvent.target?.result,
                  });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
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
