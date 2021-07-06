import { Extension, Range } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import defaultCommands from "./defaultCommands";
import { CommandGroup, SlashCommand } from "./SlashCommand";
import { SuggestionPlugin } from "../../prosemirrorPlugins/suggestions/SuggestionPlugin";
import { searchBlocks } from "../../../../search";
import { Node } from "prosemirror-model";
import uniqueId from "../../../../util/uniqueId";

export type SlashCommandOptions = {
  commands: { [key: string]: SlashCommand };
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    replaceRangeAndUpdateSelection: {
      /**
       * Command for replacing a range with a node.
       *
       * This command tries to put the cursor at the start of the newly created node,
       * such that the user can start typing in the new node immediately.
       *
       * **The behaviour of this command is undefined if the new node is not editable (i.e. if the cursor cannot be placed inside of the new node).**
       *
       * @param range the range to replace
       * @param node the prosemirror node to insert
       * @returns true iff the command succeeded
       */
      replaceRangeAndUpdateSelection: (range: Range, node: Node) => ReturnType;
    };
  }
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "slash-command",

  defaultOptions: {
    commands: defaultCommands,
  },

  addCommands() {
    return {
      replaceRangeAndUpdateSelection:
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

            // These positions mark the lower and upper bound of the range for searching the position of the newly placed node
            const mappedFrom = tr.mapping.map(from, -1);
            const mappedTo = tr.mapping.map(to, 1);

            const blockId = node.attrs["block-id"];

            // Keeps track of whether the node has been placed yet
            let placed = false;

            // Go over all nodes in the range
            // Refer to https://discuss.prosemirror.net/t/find-new-node-instances-and-track-them/96
            // for a discussion on how to find the position of a newly placed node in the document
            tr.doc.nodesBetween(mappedFrom, mappedTo, (n, pos) => {
              // If cursor is already placed, exit the callback and stop recursing
              if (placed) return false;

              // Check if this node is the node we just created, by comparing their block-id
              if (n.attrs["block-id"] === blockId) {
                tr.setSelection(Selection.near(tr.doc.resolve(pos)));

                placed = true;
                // Stop recursing
                return false;
              }
            });

            if (!placed) {
              console.error("couldn't find node after /command insertion");
            }
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

          const results = commands.filter((cmd: SlashCommand) =>
            cmd.match(query)
          );

          const searchResults = searchBlocks(query);
          if (searchResults.length) {
            searchResults.forEach((r) => {
              results.push(
                new SlashCommand(
                  r.match.value!,
                  CommandGroup.SEARCH,
                  (editor, range) => {
                    const node = editor.schema.node("ref", {
                      documentId: r.document.id,
                      blockId: r.block.id, // TODO: better naming for self vs reffed block
                      "block-id": uniqueId(),
                    });
                    return editor
                      .chain()
                      .replaceRangeAndUpdateSelection(range, node)
                      .focus()
                      .scrollIntoView()
                      .run();
                  },
                  []
                )
              );
            });
          }
          return results;
        },
        onSelectItem: ({ item, editor, range }) => {
          item.execute(editor, range);
        },
      }),
    ];
  },
});
