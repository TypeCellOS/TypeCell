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
            // The block id is used to keep track of the node, such that we can be 100% certain
            // that  the cursor is placed in the right nod
            if (!node.attrs["block-id"]) {
              throw new Error("replaceRangeCustom expects block-id");
            }
            // Replace range with node
            tr.replaceRangeWith(from, to, node);

            // unfortunately, we need a setTimeout, to make sure the React lifecycle has been flushed and NodeViews have been rendered completely
            // (maybe calling editor....reactcomponent.forceUpdate(callback)) would be cleaner
            setTimeout(() => {
              // Keeps track of whether the node has been placed yet
              let placed = false;
              // Go over all nodes in the range
              // Refer to https://discuss.prosemirror.net/t/find-new-node-instances-and-track-them/96
              // for a discussion on how to find the position of a newly placed node in the document
              tr.doc.descendants((n, pos) => {
                // If cursor is already placed, exit the callback and stop recursing
                if (placed) return false;

                // Check if this node is the node we just created, by comparing their block-id
                if (n.attrs["block-id"] === node.attrs["block-id"]) {
                  this.editor.view.dispatch(
                    this.editor.state.tr.setSelection(
                      Selection.near(tr.doc.resolve(pos))
                    )
                  );

                  placed = true;
                  // Stop recursing
                  return false;
                }
              });
              if (!placed) {
                console.error("couldn't find node after /command insertion");
              }
            }, 0);
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
