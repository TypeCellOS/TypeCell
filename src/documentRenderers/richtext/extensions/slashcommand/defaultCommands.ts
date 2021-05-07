import { toInteger } from "lodash";
import { SlashCommand } from "./SlashCommand";

const defaultCommands: { [key: string]: SlashCommand } = {
  heading: new SlashCommand(
    "heading",
    (editor, range, args) => {
      const level = args ? toInteger(args[1]) : 1;

      const node = editor.schema.node("heading", {
        level: level,
      });

      editor.chain().focus().replaceRangeCustom(range, node).run();

      return true;
    },
    [],
    /(heading|h)([1-6]?)/
  ),
  paragraph: new SlashCommand(
    "paragraph",
    (editor, range) => {
      const node = editor.schema.node("paragraph");

      editor.chain().focus().replaceRangeCustom(range, node).run();

      return true;
    },
    ["p"]
  ),
  codeblock: new SlashCommand(
    "codeblock",
    (editor, range) => {
      const node = editor.schema.node("codeBlock");

      editor.chain().focus().replaceRangeCustom(range, node).run();

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

      editor.chain().focus().replaceRangeCustom(range, node).run();

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

      editor.chain().focus().replaceRangeCustom(range, node).run();

      return true;
    },
    ["ol"]
  ),
  blockquote: new SlashCommand(
    "blockquote",
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const node = editor.schema.node("blockquote", {}, paragraph);

      editor.chain().focus().replaceRangeCustom(range, node).run();

      return true;
    },
    ["quote"]
  ),

  horizontalRule: new SlashCommand(
    "horizontalRule",
    (editor, range) => {
      const node = editor.schema.node("horizontalRule");

      editor.chain().focus().replaceRangeCustom(range, node).run();

      const newCursorPos = editor.state.selection.$to.end();

      editor
        .chain()
        .setTextSelection({ from: newCursorPos, to: newCursorPos })
        .insertContent({
          type: "paragraph",
        })
        .run();

      return true;
    },
    ["hr"]
  ),
};

export default defaultCommands;
