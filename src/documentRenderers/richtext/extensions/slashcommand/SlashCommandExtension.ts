import { Extension, Command, Range } from "@tiptap/core";
import { Selection } from "prosemirror-state";
import { Node } from "prosemirror-model";
import defaultCommands from "./defaultCommands";
import { matchSlashCommand, SlashCommand } from "./SlashCommand";
import { Editor, ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";
import { SlashCommandPlugin } from "./SlashCommandPlugin";

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
export function findCommandBeforeCursor(
  char: string,
  selection: Selection<any>
): { range: Range; query: string } | undefined {
  if (!selection.empty) return undefined;

  if (selection.$anchor.parent.type.name !== "paragraph") return undefined;

  const node = selection.$anchor.nodeBefore;

  if (!node || !node.text) return undefined;

  const parts = node.text.split(" ");

  if (parts.length < 1) return undefined;

  const lastPart = parts[parts.length - 1];
  // TODO: Make starting character dynamic
  const match = lastPart.match(/\/(\w*)$/);

  if (!match) return undefined;

  return {
    query: match[1],
    range: {
      from: selection.$anchor.pos - match[1].length - 1,
      to: selection.$anchor.pos,
    },
  };
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
  onSelectionUpdate() {},
  // addKeyboardShortcuts() {
  //   return {
  //     Enter: () => {
  //       const { selection } = this.editor.state;

  //       // Check if there is a command right before the cursor; exit otherwise
  //       const match = findCommandBeforeCursor("/", selection);
  //       if (!match) return false;

  //       // Find a matching slash command
  //       let result = matchSlashCommand(this.options.commands, match.query);

  //       if (!result) return false;

  //       // If such a command exists, replace the command text with the node created by the command
  //       if (result.command) {
  //         return result.command.execute(this.editor, match.range, result.args);
  //       }

  //       return false;
  //     },
  //   };
  // },
  onTransaction({ transaction }) {},
  onFocus({ event }) {},
  onBlur({ event }) {},
  onDestroy() {},
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
      SlashCommandPlugin({
        editor: this.editor,
        items: (query) => {
          const commands = [];

          for (const key in this.options.commands) {
            commands.push(this.options.commands[key]);
          }

          return commands.filter((cmd: SlashCommand) =>
            cmd.name.toLowerCase().startsWith(query.toLowerCase())
          );
        },
        render: () => {
          let component: ReactRenderer;
          let popup: any;

          return {
            onStart: (props) => {
              console.log("start");
              component = new ReactRenderer(CommandList as any, {
                editor: this.editor as Editor,
                props: {
                  items: props.items,
                  selectItemCallback: props.selectItemCallback,
                },
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate: (props) => {
              console.log("update");

              component.updateProps(props);

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown: (props) => {
              if (!component.ref) return false;
              return (component.ref as CommandList).onKeyDown(props);
            },

            onExit: (props) => {
              console.log("exit");

              popup[0].destroy();
              component.destroy();
            },
          };
        },
        selectItemCallback: ({ command, editor, range }) => {
          command.execute(this.editor, range);
        },
      }),
    ];
  },
});
