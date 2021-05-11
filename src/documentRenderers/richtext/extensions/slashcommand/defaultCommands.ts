import { TextSelection } from "prosemirror-state";
import { CommandGroup, SlashCommand } from "./SlashCommand";

const defaultCommands: { [key: string]: SlashCommand } = {
  // Command for creating a level 1 heading
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

  // Command for creating a level 2 heading
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

  // Command for creating a level 3 heading
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

  // Command for creating a level 4 heading
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

  // Command for creating a level 5 heading
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

  // Command for creating a level 6 heading
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

  // Command for creating a paragraph (pretty useless)
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

  // Command for creating a code block
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

  // Command for creating a bullet list
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

  // Command for creating an ordered list
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

  // Command for creating a blockquote
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

  // Command for creating a horizontal rule
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
