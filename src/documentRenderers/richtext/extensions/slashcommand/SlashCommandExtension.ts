import { Extension, Command, Range } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import { Node } from "prosemirror-model";
import defaultCommands from "./defaultCommands";
import { matchSlashCommand, SlashCommand } from "./SlashCommand";

declare module "@tiptap/core" {
  interface Commands {
    replaceRangeCustom: {
      /**
       * Replaces text with a node within a range.
       */
      replaceRangeCustom: (range: Range, node: Node) => Command;
    };
  }
}

/**
 * Finds a command: a '/' followed by a string of letters and/or numbers.
 * Returns the word following the '/' or undefined if no such word could be found.
 * Only works if the command is right before the cursor (without a space in between) and the cursor is in a paragraph node.
 *
 * @param selection the selection (only works if the selection is empty; i.e. is a cursor).
 * @returns the word following a '/' or undefined if no such word could be found.
 */
function findCommandBeforeCursor(
  selection: Selection<any>
): string | undefined {
  if (!selection.empty) return undefined;

  if (selection.$anchor.parent.type.name !== "paragraph") return undefined;

  const node = selection.$anchor.nodeBefore;

  if (!node || !node.text) return undefined;

  const parts = node.text.split(" ");

  if (parts.length < 1) return undefined;

  const lastPart = parts[parts.length - 1];
  const match = lastPart.match(/\/(\w+)$/);

  if (!match) return undefined;

  return match[1] ?? undefined;
}

export type SlashCommandOptions = {
  commands: { [key: string]: SlashCommand };
};

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: "slash-command",

  defaultOptions: {
    commands: defaultCommands,
  },

  onCreate() {
    // The editor is ready.
  },
  onUpdate() {},
  onSelectionUpdate() {
    console.log(this.editor.state.selection.$anchor.pos);
    const match = findCommandBeforeCursor(this.editor.state.selection);
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { selection } = this.editor.state;

        // Check if there is a command right before the cursor; exit otherwise
        const match = findCommandBeforeCursor(selection);
        if (!match) return false;

        // Find a matching slash command
        let result = matchSlashCommand(this.options.commands, match);

        if (!result) return false;

        // If such a command exists, replace the command text with the node created by the command
        if (result.command) {
          const { $anchor } = selection;
          const start = $anchor.start();
          const end = $anchor.end();

          // Create the node using the command's callback
          const range = { from: start, to: end };

          console.log(range);

          return result.command.execute(this.editor, range, result.args);

          // Replace the command text with the new node

          // tr.replaceRangeWith(start, end, newNode);

          // Move the cursor to the newly created node
          // BUG: Doesn't work properly in nested blocks such as lists
          // const resolvedAnchor = tr.doc.resolve(tr.mapping.map(start, -1));

          // tr.setSelection(Selection.near(resolvedAnchor, 1));
        }

        return false;
      },
    };
  },
  onTransaction({ transaction }) {
    // The editor state has changed.
  },
  onFocus({ event }) {
    // The editor is focused.
  },
  onBlur({ event }) {
    // The editor isn’t focused anymore.
  },
  onDestroy() {
    // The editor is being destroyed.
  },
  addCommands() {
    return {
      replaceRangeCustom: (range, node) => ({ tr, commands, dispatch }) => {
        const { from, to } = range;

        if (dispatch) {
          tr.replaceRangeWith(from, to, node);
        }

        return true;
      },
    };
  },
});
