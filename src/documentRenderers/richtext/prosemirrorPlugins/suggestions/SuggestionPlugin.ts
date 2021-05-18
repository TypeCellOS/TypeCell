import { Editor, Range } from "@tiptap/core";
import { escapeRegExp, groupBy } from "lodash";
import { Plugin, PluginKey, Selection } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import SuggestionItem from "./SuggestionItem";
import createRenderer from "./SuggestionListReactRenderer";
import { ReplaceStep } from "prosemirror-transform";
export interface SuggestionRenderer<T extends SuggestionItem> {
  onExit?: (props: SuggestionRendererProps<T>) => void;
  onUpdate?: (props: SuggestionRendererProps<T>) => void;
  onStart?: (props: SuggestionRendererProps<T>) => void;
  onKeyDown?: (props: SuggestionRendererKeyDownProps) => boolean;
}

export interface SuggestionRendererKeyDownProps {
  view: EditorView;
  event: KeyboardEvent;
  range: Range;
}

export type SuggestionRendererProps<T extends SuggestionItem> = {
  editor: Editor;
  range: Range;
  query: string;
  groups: {
    [groupName: string]: T[];
  };
  count: number;
  selectItemCallback: (item: T) => void;
  decorationNode: Element | null;
  // virtual node for popper.js or tippy.js
  // this can be used for building popups without a DOM node
  clientRect: (() => DOMRect) | null;
  onClose: () => void;
};

export type SuggestionPluginOptions<T extends SuggestionItem> = {
  editor: Editor;
  char: string;
  selectItemCallback?: (props: {
    item: T;
    editor: Editor;
    range: Range;
  }) => void;
  items?: (filter: string) => T[];
  renderer?: SuggestionRenderer<T>;
  allow?: (props: { editor: Editor; range: Range }) => boolean;
};

/**
 * Finds a command: a specified character (e.g. '/') followed by a string of letters and/or numbers.
 * Returns the word following the specified character or undefined if no such word could be found.
 * Only works if the command is right before the cursor (without a space in between) and the cursor is in a paragraph node.
 *
 * @param char the character that indicated the start of the command
 * @param selection the selection (only works if the selection is empty; i.e. is a cursor).
 * @returns an object containing the matching word (excluding the specified character) and the range of the match (including the specified character) or undefined if there is no match.
 */
export function findCommandBeforeCursor(
  char: string,
  selection: Selection<any>
): { range: Range; query: string } | undefined {
  if (!selection.empty) return undefined;

  // get the text before the cursor as a node
  const node = selection.$anchor.nodeBefore;
  if (!node || !node.text) return undefined;

  // regex to match anything between with the specified char (e.g. '/') and the end of text (which is the end of selection)
  const regex = new RegExp(`${escapeRegExp(char)}([^${escapeRegExp(char)}]*)$`);
  const match = node.text.match(regex);

  if (!match) return undefined;

  return {
    query: match[1],
    range: {
      from: selection.$anchor.pos - match[1].length - char.length,
      to: selection.$anchor.pos,
    },
  };
}

const PLUGIN_KEY = new PluginKey("suggestion");

/**
 * A ProseMirror plugin for suggestions, designed to make '/'-commands possible as well as mentions.
 *
 * This is basically a simplified version of TipTap's [Suggestions](https://github.com/ueberdosis/tiptap/tree/db92a9b313c5993b723c85cd30256f1d4a0b65e1/packages/suggestion) plugin.
 *
 * This version is adapted from the aforementioned version in the following ways:
 * - This version supports generic items instead of only strings (to allow for more advanced filtering for example)
 * - This version hides some unnecessary complexity from the user of the plugin.
 *
 * @param options options for configuring the plugin
 * @returns the prosemirror plugin
 */
export function SuggestionPlugin<T extends SuggestionItem>({
  editor,
  char,
  selectItemCallback = () => {},
  items = () => [],
  renderer = undefined,
}: SuggestionPluginOptions<T>) {
  // Use react renderer by default
  // This will fail if the editor is not a @tiptap/react editor
  if (!renderer) renderer = createRenderer(editor);

  return new Plugin({
    key: PLUGIN_KEY,

    view() {
      return {
        update: async (view, prevState) => {
          const prev = this.key?.getState(prevState);
          const next = this.key?.getState(view.state);

          // See how the state changed
          const started = !prev.active && next.active;
          const stopped = prev.active && !next.active;
          const changed = !started && !stopped && prev.query !== next.query;

          // Cancel when suggestion isn't active
          if (!started && !changed && !stopped) {
            return;
          }

          const state = stopped ? prev : next;
          const decorationNode = document.querySelector(
            `[data-decoration-id="${state.decorationId}"]`
          );

          // Filter items using query and map them to groups
          const filteredItems = state.items;
          const groups: { [groupName: string]: T[] } = groupBy(
            filteredItems,
            "groupName"
          );

          const rendererProps: SuggestionRendererProps<T> = {
            editor,
            range: state.range,
            query: state.query,
            groups: changed || started ? groups : {},
            count: filteredItems.length,
            selectItemCallback: (item: T) => {
              selectItemCallback({
                item,
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
            onClose: () => {
              renderer?.onExit?.(rendererProps);
            },
          };

          if (stopped) {
            renderer?.onExit?.(rendererProps);
          }

          if (changed) {
            renderer?.onUpdate?.(rendererProps);
          }

          if (started) {
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
          notFoundCount: 0,
          items: [],
        };
      },

      // Apply changes to the plugin state from a view transaction.
      apply(transaction, prev) {
        const { selection } = transaction;
        const next = { ...prev };
        // We can only be suggesting if there is no selection

        if (
          selection.from === selection.to &&
          !transaction.getMeta("focus") &&
          !transaction.getMeta("blur") &&
          !transaction.getMeta("pointer")
        ) {
          // Reset active state if we just left the previous suggestion range
          if (prev.active && selection.from <= prev.range.from) {
            next.active = false;
          } else if (transaction.getMeta(PLUGIN_KEY)?.activate) {
            transaction.setMeta(PLUGIN_KEY, undefined);
            const newDecorationId = `id_${Math.floor(
              Math.random() * 0xffffffff
            )}`;
            next.decorationId = newDecorationId;
            next.range = {
              from: selection.from - 1,
              to: selection.to,
            };
            next.query = "";
            next.active = true;
          } else if (prev.active) {
            // Try to match against where our cursor currently is
            const match = findCommandBeforeCursor(char, selection);
            if (!match) {
              throw new Error("active but no match (suggestions)");
            }

            next.range = match.range;
            next.active = true;
            next.decorationId = prev.decorationId;
            next.query = match.query;
          }
        } else {
          next.active = false;
        }

        if (next.active) {
          next.items = items(next.query);
          if (next.items.length) {
            next.notFoundCount = 0;
          } else {
            // Update the "notFoundCount",
            // which indicates how many characters have been typed after showing no results
            if (
              transaction.steps.find(
                (s) => s instanceof ReplaceStep && (s as any).slice.size
              )
            ) {
              // Text has been entered, but still no items found, update Count
              next.notFoundCount = prev.notFoundCount + 1;
            } else {
              // No text has been entered in this tr, keep not found count
              // (e.g.: user hits backspace after no results)
              next.notFoundCount = prev.notFoundCount;
            }
          }

          if (next.notFoundCount > 3) {
            next.active = false;
          }
        }

        // Make sure to empty the range if suggestion is inactive
        if (!next.active) {
          next.decorationId = null;
          next.range = {};
          next.query = null;
          next.notFoundCount = 0;
          next.items = [];
        }

        return next;
      },
    },

    props: {
      handleKeyDown(view, event) {
        const { active, range } = this.getState(view.state);

        if (!active) {
          // activate the popup on / keypress
          if (event.key === "/") {
            view.dispatch(
              view.state.tr
                .insertText("/")
                .scrollIntoView()
                .setMeta(PLUGIN_KEY, { activate: true })
            );
            // return true to cancel the original event, as we insert / ourselves
            return true;
          }
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
            class: "suggestion-decorator",
            "data-decoration-id": decorationId,
          }),
        ]);
      },
    },
  });
}
