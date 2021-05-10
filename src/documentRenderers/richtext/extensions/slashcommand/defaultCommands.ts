import { toInteger } from "lodash";
import { doc } from "prettier";
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
  typecell: new SlashCommand(
    "typecell",
    (editor, range) => {
      const node = editor.schema.node("typecell");

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["typecell"]
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

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            const { parent } = tr.selection.$to;
            const nodeAfter = tr.selection.$to.nodeAfter;

            const posAfter = tr.selection.$to.pos;

            // end of document
            if (!nodeAfter) {
              const node = parent.type.contentMatch.defaultType?.create();

              if (node) {
                tr.insert(posAfter, node);
                tr.setSelection(TextSelection.create(tr.doc, posAfter));
              }
            }

            tr.doc.nodesBetween(posAfter, posAfter + 1, (node, pos) => {
              if (node.type.name !== "horizontalRule") {
                tr.setSelection(TextSelection.create(tr.doc, pos));
              }
            });

            tr.scrollIntoView();
          }

          return true;
        })
        .run();
      return true;
    },
    ["hr"]
  ),
};

export default defaultCommands;
