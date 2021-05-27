import { Extension } from "@tiptap/core";
import { TextSelection } from "prosemirror-state";
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
        ({ tr, dispatch, editor }) => {
          const { from, to } = range;

          if (dispatch) {
            // Give the node a temporary id.
            // This temporary id is used to keep track of the node, such that we can be 100% certain
            // that  the cursor is placed in the right node (and not a different node of the same type for example)
            // TODO: replace this temp-id "hack" with node-id's (once we have implemented the node-id system)
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
            // Refer to https://discuss.prosemirror.net/t/find-new-node-instances-and-track-them/96
            // for a discussion on how to find the position of a newly placed node in the document
            tr.doc.nodesBetween(mappedFrom, mappedTo, (n, pos) => {
              // If cursor is already placed, exit the callback and stop recursing
              if (placed) return false;

              // Check if this node is the node we just created, by comparing their temp-id
              // IMPORTANT: this temp-id is used to ensure that we place the cursor in the correct node
              // Only comparing types, for example, is not sufficient, because the cursor might be
              // placed in a different node of the same type
              if (n.attrs["temp-id"] === node.attrs["temp-id"]) {
                tr.setSelection(TextSelection.create(tr.doc, pos));
                placed = true;

                // Stop recursing
                return false;
              }

              // In case of no success; keep on recursing
              return true;
            });

            // Clear the temp-id (NOTE: this might not work correctly, since nodes are supposed to be immutable)
            node.attrs["temp-id"] = undefined;
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
