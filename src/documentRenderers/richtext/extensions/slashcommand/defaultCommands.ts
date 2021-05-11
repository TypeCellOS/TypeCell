import { TextSelection } from "prosemirror-state";
import { CommandGroup, SlashCommand } from "./SlashCommand";

const defaultCommands: { [key: string]: SlashCommand } = {
  heading: new SlashCommand(
    "Heading",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 1,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["h", "heading1", "h1"]
  ),
  heading2: new SlashCommand(
    "Heading 2",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 2,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["h2", "heading2", "subheading"]
  ),
  heading3: new SlashCommand(
    "Heading 3",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 3,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["h3", "heading3", "subsubheading"]
  ),
  heading4: new SlashCommand(
    "Heading 4",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 4,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["h4", "heading4"]
  ),
  heading5: new SlashCommand(
    "Heading 5",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 5,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["h5", "heading5"]
  ),
  heading6: new SlashCommand(
    "Heading 6",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 6,
      });

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["h6", "heading6"]
  ),
  paragraph: new SlashCommand(
    "Paragraph",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("paragraph");

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["p"]
  ),
  codeblock: new SlashCommand(
    "Code Block",
    CommandGroup.BASIC,
    (editor, range) => {
      const node = editor.schema.node("codeBlock");

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["code", "codeblock"]
  ),
  bulletlist: new SlashCommand(
    "Bullet List",
    CommandGroup.BASIC,
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("bulletList", {}, listItem);

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["ul", "list", "bulletlist"]
  ),
  orderedlist: new SlashCommand(
    "Ordered List",
    CommandGroup.BASIC,
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("orderedList", {}, listItem);

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["ol", "orderedlist"]
  ),
  blockquote: new SlashCommand(
    "Block Quote",
    CommandGroup.BASIC,
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const node = editor.schema.node("blockquote", {}, paragraph);

      editor.chain().replaceRangeCustom(range, node).run();

      return true;
    },
    ["quote", "blockquote"]
  ),

  horizontalRule: new SlashCommand(
    "Horizontal Rule",
    CommandGroup.BASIC,
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
    ["hr", "horizontalrule"]
  ),
};

export default defaultCommands;
