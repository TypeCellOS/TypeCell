import { toInteger } from "lodash";
import { SlashCommand } from "./SlashCommand";

const defaultCommands: { [key: string]: SlashCommand } = {
  heading: new SlashCommand(
    "heading",
    (editor, args) => {
      const level = args ? toInteger(args[1]) : 1;

      return editor.schema.node("heading", {
        level: level,
      });
    },
    [],
    /(heading|h)([1-6]?)/
  ),
  paragraph: new SlashCommand(
    "paragraph",
    (editor) => {
      return editor.schema.node("paragraph");
    },
    ["p"]
  ),
  codeblock: new SlashCommand(
    "codeblock",
    (editor) => {
      return editor.schema.node("codeBlock");
    },
    ["code"]
  ),
  bulletlist: new SlashCommand(
    "bulletlist",
    (editor) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("bulletList", {}, listItem);

      return node;
    },
    ["ul", "list"]
  ),
  orderedlist: new SlashCommand(
    "orderedlist",
    (editor) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("orderedList", {}, listItem);

      return node;
    },
    ["ol"]
  ),
  blockquote: new SlashCommand(
    "blockquote",
    (editor) => {
      const paragraph = editor.schema.node("paragraph");
      const node = editor.schema.node("blockquote", {}, paragraph);

      return node;
    },
    ["quote"]
  ),

  horizontalRule: new SlashCommand(
    "horizontalRule",
    (editor) => {
      const node = editor.schema.node("horizontalRule");

      return node;
    },
    ["hr"]
  ),
};

export default defaultCommands;
