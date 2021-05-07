import { Editor, Range } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { SlashCommand } from "./SlashCommand";
import { findCommandBeforeCursor } from "./SlashCommandExtension";

export type SlashCommandPluginCommandProps = {};

export interface SlashCommandRenderer {
  onExit?: (props: SlashCommandRendererProps) => void;
  onUpdate?: (props: SlashCommandRendererProps) => void;
  onStart?: (props: SlashCommandRendererProps) => void;
  onKeyDown?: (props: SlashCommandRendererKeyDownProps) => boolean;
}

export interface SlashCommandRendererKeyDownProps {
  view: EditorView;
  event: KeyboardEvent;
  range: Range;
}

export type SlashCommandRendererProps = {
  editor: Editor;
  range: Range;
  query: string;
  items: SlashCommand[];
  selectItemCallback: (command: SlashCommand) => void;
  decorationNode: Element | null;
  // virtual node for popper.js or tippy.js
  // this can be used for building popups without a DOM node
  clientRect: (() => DOMRect) | null;
};

export type SlashCommandPluginOptions = {
  editor: Editor;
  char?: string;
  selectItemCallback?: (props: {
    command: SlashCommand;
    editor: Editor;
    range: Range;
  }) => void;
  items?: (filter: string) => SlashCommand[];
  render?: () => SlashCommandRenderer;
  allow?: (props: { editor: Editor; range: Range }) => boolean;
};

/**
 * A ProseMirror plugin for '/' commands.
 *
 * This is basically a simplified version of TipTap's [Suggestions](https://github.com/ueberdosis/tiptap/tree/db92a9b313c5993b723c85cd30256f1d4a0b65e1/packages/suggestion) plugin.
 *
 * @param options
 * @returns
 */
export function SlashCommandPlugin({
  editor,
  char = "/",
  selectItemCallback = () => {},
  items = () => [],
  render = () => ({}),
  allow = () => true,
}: SlashCommandPluginOptions) {
  const renderer = render?.();

  return new Plugin({
    key: new PluginKey("suggestion"),

    view() {
      return {
        update: async (view, prevState) => {
          const prev = this.key?.getState(prevState);
          const next = this.key?.getState(view.state);

          // See how the state changed
          const moved =
            prev.active && next.active && prev.range.from !== next.range.from;
          const started = !prev.active && next.active;
          const stopped = prev.active && !next.active;
          const changed = !started && !stopped && prev.query !== next.query;
          const handleStart = started || moved;
          const handleChange = changed && !moved;
          const handleExit = stopped || moved;

          // Cancel when suggestion isn't active
          if (!handleStart && !handleChange && !handleExit) {
            return;
          }

          const state = handleExit ? prev : next;
          const decorationNode = document.querySelector(
            `[data-decoration-id="${state.decorationId}"]`
          );
          const rendererProps: SlashCommandRendererProps = {
            editor,
            range: state.range,
            query: state.query,
            items: handleChange || handleStart ? await items(state.query) : [],
            selectItemCallback: (command: SlashCommand) => {
              selectItemCallback({
                command,
                editor,
                range: state.range,
              });
            },
            decorationNode,
            // virtual node for popper.js or tippy.js
            // this can be used for building popups without a DOM node
            clientRect: decorationNode
              ? () => decorationNode.getBoundingClientRect()
              : null,
          };

          if (handleExit) {
            renderer?.onExit?.(rendererProps);
          }

          if (handleChange) {
            renderer?.onUpdate?.(rendererProps);
          }

          if (handleStart) {
            renderer?.onStart?.(rendererProps);
          }
        },
      };
    },

    state: {
      // Initialize the plugin's internal state.
      init() {
        return {
          active: false,
          range: {},
          query: null,
        };
      },

      // Apply changes to the plugin state from a view transaction.
      apply(transaction, prev) {
        const { selection } = transaction;
        const next = { ...prev };

        // We can only be suggesting if there is no selection
        if (selection.from === selection.to) {
          // Reset active state if we just left the previous suggestion range
          if (
            selection.from < prev.range.from ||
            selection.from > prev.range.to
          ) {
            next.active = false;
          }

          // Try to match against where our cursor currently is
          const match = findCommandBeforeCursor(char, selection);
          const decorationId = `id_${Math.floor(Math.random() * 0xffffffff)}`;

          // If we found a match, update the current state to show it
          if (match && allow({ editor, range: match.range })) {
            next.active = true;
            next.decorationId = prev.decorationId
              ? prev.decorationId
              : decorationId;
            next.range = match.range;
            next.query = match.query;
          } else {
            next.active = false;
          }
        } else {
          next.active = false;
        }

        // Make sure to empty the range if suggestion is inactive
        if (!next.active) {
          next.decorationId = null;
          next.range = {};
          next.query = null;
        }

        return next;
      },
    },

    props: {
      // Call the keydown hook if suggestion is active.
      handleKeyDown(view, event) {
        const { active, range } = this.getState(view.state);

        if (!active) {
          return false;
        }

        return renderer?.onKeyDown?.({ view, event, range }) || false;
      },

      // Setup decorator on the currently active suggestion.
      decorations(state) {
        const { active, range, decorationId } = this.getState(state);

        if (!active) {
          return null;
        }

        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: "span",
            class: "command-decorator",
            "data-decoration-id": decorationId,
          }),
        ]);
      },
    },
  });
}
