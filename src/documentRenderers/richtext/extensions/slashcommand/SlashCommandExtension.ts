import { Extension, Command, Range } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import { Node } from "prosemirror-model";
import defaultCommands from "./defaultCommands";
import { SlashCommand } from "./SlashCommand";
import { SuggestionPlugin } from "../../prosemirrorPlugins/suggestions/SuggestionPlugin";

declare module "@tiptap/core" {
  interface Commands {
    replaceRangeCustom: {
      /**
       * Command for replacing a range with a node.
       *
       * This command tries to put the cursor at the start of the newly created node,
       * such that the user can start typing in the new node immediately.
       *
       * **Only use this command works best for inserting nodes that contain editable text.**
       *
       * @param range the range
       * @param node the prosemirror node
       * @returns true iff the command succeeded
       */
      replaceRangeCustom: (range: Range, node: Node) => Command;
    };
  }
}

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
      replaceRangeCustom: (range, node) => ({ tr, dispatch }) => {
        const { from, to } = range;

        if (dispatch) {
          tr.replaceRangeWith(from, to, node);
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
