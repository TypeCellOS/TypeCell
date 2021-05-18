import { mergeAttributes, Node } from "@tiptap/core";
import { SuggestionPlugin } from "../../prosemirrorPlugins/suggestions/SuggestionPlugin";
import { Mention } from "./Mention";

export type MentionsOptions = {
  providers: { [key: string]: (query: string) => Mention[] };
};

/**
 * This is a TipTap extension / node type that defines the behavior of mentions.
 *
 * This extension is largely based on TipTap's
 * [Mention](https://github.com/ueberdosis/tiptap/tree/main/packages/extension-mention) extension,
 * but adapted to work with our custom SuggestionPlugin.
 *
 * **TODO:** Currently mentions only provide styling, but in the future it will be useful to be able
 * to supply metadata to mentions, such as (a link to) a user profile or a reference to a document.
 * Such that, when the user clicks on a mention, a popup with info will show (for example).
 */
export const MentionsExtension = Node.create<MentionsOptions>({
  name: "mention",

  defaultOptions: {
    providers: {},
  },

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => {
          return {
            id: element.getAttribute("data-mention"),
          };
        },
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            "data-mention": attributes.id,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ class: "mention" }, HTMLAttributes),
      `@${node.attrs.id}`,
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.id}`;
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          // Delete mention but preserve the @ symbol
          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true;
              tr.insertText("@", pos, pos + node.nodeSize);

              return false;
            }
          });

          return isMention;
        }),
    };
  },

  addProseMirrorPlugins() {
    return [
      SuggestionPlugin<Mention>({
        editor: this.editor,
        char: "@",
        items: (query) => {
          const mentions: Mention[] = [];

          for (const key in this.options.providers) {
            const provider = this.options.providers[key];
            mentions.push(...provider(query));
          }

          return mentions;
        },
        selectItemCallback: ({ item, editor, range }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: "mention",
                attrs: {
                  id: item.name,
                },
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
      }),
    ];
  },
});
