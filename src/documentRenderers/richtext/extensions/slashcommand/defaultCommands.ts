import { toInteger } from "lodash";
import { TextSelection } from "prosemirror-state";
import { SlashCommand } from "./SlashCommand";

const defaultCommands: { [key: string]: SlashCommand } = {
  heading: new SlashCommand(
    "heading",
    (editor, range, args) => {
      const level = args ? toInteger(args[1]) : 1;

      const node = editor.schema.node("heading", {
        level: level,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    [],
    /(heading|h)([1-6]?)/
  ),
  paragraph: new SlashCommand(
    "paragraph",
    (editor, range) => {
      const node = editor.schema.node("paragraph");

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["p"]
  ),
  codeblock: new SlashCommand(
    "codeblock",
    (editor, range) => {
      const node = editor.schema.node("codeBlock");

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["code"]
  ),
  bulletlist: new SlashCommand(
    "bulletlist",
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("bulletList", {}, listItem);

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["ul", "list"]
  ),
  orderedlist: new SlashCommand(
    "orderedlist",
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("orderedList", {}, listItem);

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["ol"]
  ),
  blockquote: new SlashCommand(
    "blockquote",
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const node = editor.schema.node("blockquote", {}, paragraph);

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["quote"]
  ),

  horizontalRule: new SlashCommand(
    "horizontalRule",
    (editor, range) => {
      const node = editor.schema.node("horizontalRule");

      // insert horizontal rule, create a new block after the horizontal rule if applicable
      // and put the cursor in the block after the horizontal rule.
      editor
        .chain()
        .replaceRangeCustom(range, node)
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            // the node immediately after the cursor
            const nodeAfter = tr.selection.$to.nodeAfter;

            // the position of the cursor
            const cursorPos = tr.selection.$to.pos;

            // check if there is no node after the cursor (end of document)
            if (!nodeAfter) {
              // create a new block of the default type (probably paragraph) after the cursor
              const { parent } = tr.selection.$to;
              const node = parent.type.contentMatch.defaultType?.create();

              if (node) {
                tr.insert(cursorPos, node);
              }
            }

            // try to put the cursor at the start of the node directly after the inserted horizontal rule
            tr.doc.nodesBetween(cursorPos, cursorPos + 1, (node, pos) => {
              if (node.type.name !== "horizontalRule") {
                tr.setSelection(TextSelection.create(tr.doc, pos));
              }
            });
          }

          return true;
        })
        .scrollIntoView()
        .run();
      return true;
    },
    ["hr"]
  ),
};

export default defaultCommands;
