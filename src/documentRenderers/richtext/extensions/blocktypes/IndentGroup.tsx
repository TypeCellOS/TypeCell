import { Command, mergeAttributes, Node, findParentNode } from "@tiptap/core";
import { isList } from "../../util/isList";
import { findWrapping, canJoin } from "prosemirror-transform";
import "./Block.module.css";
import { getNodeType } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands {
    toggleIndentGroup: {
      /**
       * Create an indent group from a root-level node
       */
      createIndentGroup: () => Command;
    };
  }
}

/**
 * The IndentGroup makes every block element "indentable" by pressing Tab.
 * Blocks can only be tabbed 1 level further than its parent
 *
 * The IndentGroup works the same as BulletList. In fact, this file is largely a copy of TipTap BulletList
 */
const IndentGroup = Node.create({
  name: "indentGroup",

  defaultOptions: {
    HTMLAttributes: {},
  },

  group: "block list",

  // Take indentItem as children instead of listItem
  content: "indentItem+",

  parseHTML() {
    return [{ tag: "div" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      /**
       * Create an indent group from a root-level node.
       * This command doesn't exist for lists, as lists are always created via:
       * - menus
       * - typing "-", but that's a wrappingInputRule
       *
       * This command can be triggered by pressing Tab in a Block element (see ./index.ts)
       */
      createIndentGroup:
        () =>
        ({ commands, state, dispatch }) => {
          // We had to create a custom command here, because:
          // it's not the same as toggleList, we only want to create an indent group when we're at the root level
          //    (nesting is handled by commands on the children, see ./index.ts)

          // beginning from https://github.com/ueberdosis/tiptap/blob/main/packages/core/src/commands/toggleList.ts
          const { selection } = state;
          const { $from, $to } = selection;
          const range = $from.blockRange($to);

          if (!range) {
            return false;
          }

          const parentList = findParentNode((node) => isList(node))(selection);

          if (
            range.depth >= 1 &&
            parentList &&
            range.depth - parentList.depth <= 1
          ) {
            // we're already indented / or in a list, don't handle here, but by "sinkListItem" in ./index
            return false;
          }

          let nodeType = getNodeType("indentGroup", state.schema);

          // based on https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rulebuilders.js
          // We had to use this instead of just toggleList command, until this has been resolved:
          // https://github.com/ueberdosis/tiptap/issues/1329
          if (dispatch) {
            let start = range.start;
            // let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
            let tr = state.tr; //.delete(start, range1.end);
            let wrapping = range && findWrapping(range, nodeType, {});
            if (!wrapping) return false;
            tr.wrap(range, wrapping);

            // is there an indented block before? join
            // Test with
            //
            //  text (indented)
            // text
            //
            // press tab at second line. Should join to same <div>

            let before = tr.doc.resolve(start).nodeBefore;
            if (before && before.type == nodeType && canJoin(tr.doc, start)) {
              tr.join(start);
            }

            // is there an indented block after? join
            // Test with
            //
            // text
            //  text (indented)
            //
            // press tab at first line. Should join to same <div>
            let after = tr.doc.resolve(range.end + 4).nodeAfter;
            if (
              after &&
              after.type == nodeType &&
              canJoin(tr.doc, range.end + 4)
            ) {
              tr.join(range.end + 4);
            }
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // 'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
    };
  },
});

export default IndentGroup;
