import { mergeAttributes, Node } from "@tiptap/core";
import { SuggestionPlugin } from "../../prosemirrorPlugins/suggestions/SuggestionPlugin";
import { Mention } from "./Mention";
import * as _ from "lodash";

export type MentionsOptions = {
  providers: Array<(query: string) => Promise<Mention[]>>;
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
    providers: [],
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

  addProseMirrorPlugins() {
    return [
      SuggestionPlugin<Mention>({
        pluginName: "mentions",
        editor: this.editor,
        char: "@",
        items: async (query) => {
          const results = await Promise.all(
            this.options.providers.map((p) => p(query))
          );
          return results.flatMap((r) => r);
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
