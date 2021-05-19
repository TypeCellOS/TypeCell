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
            // Give the node a temporary id, for placing the cursor in it
            node.attrs["temp-id"] = `id_${Math.floor(
              Math.random() * 0xffffffff
            )}`;
            // Replace range with node
            tr.replaceRangeWith(from, to, node);

            // These positions mark the lower and upper bound of the range for searching the position of the newly placed node
            const mappedFrom = tr.mapping.map(from, -1);
            const mappedTo = tr.mapping.map(to, 1);

            // Keeps track of whether the node has been placed yet
            let placed = false;

            // Go over all nodes in the range
            tr.doc.nodesBetween(mappedFrom, mappedTo, (n, pos, parent) => {
              // If cursor is already placed, exit the callback and stop recursing
              if (placed) return false;

              // Check if this node is the node we just created, by comparing their temp-id
              if (n.attrs["temp-id"] === node.attrs["temp-id"]) {
                tr.setSelection(Selection.near(tr.doc.resolve(pos)));
                placed = true;

                // Stop recursing
                return false;
              }

              // In case of no success; keep on recursing
              return true;
            });

            // Clear the temp-id
            node.attrs["temp-id"] = undefined;
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
