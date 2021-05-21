import { Extension } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import defaultCommands from "./defaultCommands";
import { SlashCommand } from "./SlashCommand";
import { SuggestionPlugin } from "../../prosemirrorPlugins/suggestions/SuggestionPlugin";

export type SlashCommandOptions = {
  commands: { [key: string]: SlashCommand };
};

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "slash-command",

  defaultOptions: {
    commands: defaultCommands,
  },

  addCommands() {
    return {
      replaceRangeCustom:
        (range, node) =>
        ({ tr, dispatch }) => {
          const { from, to } = range;

          if (dispatch) {
            // Replace range with node
            tr.replaceRangeWith(from, to, node);

            // Put cursor at the start of the new node (or try to at least)
            const pos = tr.mapping.map(from, -1);
            tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
          }

          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      SuggestionPlugin<SlashCommand>({
        pluginName: "slash-commands",
        editor: this.editor,
        char: "/",
        items: (query) => {
          const commands = [];

          for (const key in this.options.commands) {
            commands.push(this.options.commands[key]);
          }

          return commands.filter((cmd: SlashCommand) => cmd.match(query));
        },
        selectItemCallback: ({ item, editor, range }) => {
          item.execute(editor, range);
        },
      }),
    ];
  },
});
