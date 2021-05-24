import { TextSelection } from "prosemirror-state";
import { CommandGroup, SlashCommand } from "./SlashCommand";
import { RiTableLine } from "react-icons/ri";

import { ReactComponent as H1 } from "../../icons/h-1.svg";
import { ReactComponent as H2 } from "../../icons/h-2.svg";
import { ReactComponent as H3 } from "../../icons/h-3.svg";
import { ReactComponent as H4 } from "../../icons/h-4.svg";
import { ReactComponent as H5 } from "../../icons/h-5.svg";
import { ReactComponent as H6 } from "../../icons/h-6.svg";
import { ReactComponent as TextIcon } from "../../icons/text.svg";
import { ReactComponent as CodeIcon } from "../../icons/code-text.svg";
import { ReactComponent as UnorderedList } from "../../icons/list-unordered.svg";
import { ReactComponent as OrderedList } from "../../icons/list-ordered.svg";
import { ReactComponent as QuoteIcon } from "../../icons/quote.svg";
import { ReactComponent as SeparatorIcon } from "../../icons/separator.svg";

import styles from "../../prosemirrorPlugins/suggestions/SuggestionGroup.module.css";

const defaultCommands: { [key: string]: SlashCommand } = {
  // Command for creating a level 1 heading
  heading: new SlashCommand(
    "Heading",
    CommandGroup.HEADINGS,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 1,
      });

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["h", "heading1", "h1"],
    H1,
    "Used for a top-level heading",
    "Ctrl+Alt+1"
  ),

  // Command for creating a level 2 heading
  heading2: new SlashCommand(
    "Heading 2",
    CommandGroup.HEADINGS,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 2,
      });

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["h2", "heading2", "subheading"],
    H2,
    "Used for key sections",
    "Ctrl+Alt+2"
  ),

  // Command for creating a level 3 heading
  heading3: new SlashCommand(
    "Heading 3",
    CommandGroup.HEADINGS,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 3,
      });

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["h3", "heading3", "subsubheading"],
    H3,
    "Used for subsections and group headings",
    "Ctrl+Alt+3"
  ),

  // Command for creating a level 4 heading
  heading4: new SlashCommand(
    "Heading 4",
    CommandGroup.HEADINGS,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 4,
      });

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["h4", "heading4"],
    H4,
    "Used for deep headings",
    "Ctrl+Alt+4"
  ),

  // Command for creating a level 5 heading
  heading5: new SlashCommand(
    "Heading 5",
    CommandGroup.HEADINGS,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 5,
      });

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["h5", "heading5"],
    H5,
    "Used for grouping list items",
    "Ctrl+Alt+5"
  ),

  // Command for creating a level 6 heading
  heading6: new SlashCommand(
    "Heading 6",
    CommandGroup.HEADINGS,
    (editor, range) => {
      const node = editor.schema.node("heading", {
        level: 6,
      });

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["h6", "heading6"],
    H6,
    "Used for low-level headings",
    "Ctrl+Alt+6"
  ),

  // Command for creating a paragraph (pretty useless)
  paragraph: new SlashCommand(
    "Paragraph",
    CommandGroup.BASIC_BLOCKS,
    (editor, range) => {
      const node = editor.schema.node("paragraph");

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["p"],
    TextIcon,
    "Used for the body of your document"
  ),

  // Command for creating a code block
  codeblock: new SlashCommand(
    "Code Block",
    CommandGroup.BASIC_BLOCKS,
    (editor, range) => {
      const node = editor.schema.node("codeBlock");

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["code", "codeblock"],
    CodeIcon,
    "Used to display formatted code that can't be run"
  ),

  // Command for creating a bullet list
  bulletlist: new SlashCommand(
    "Bullet List",
    CommandGroup.BASIC_BLOCKS,
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("bulletList", {}, listItem);

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["ul", "list", "bulletlist"],
    UnorderedList,
    "Used to display an unordered list item"
  ),

  // Command for creating an ordered list
  orderedlist: new SlashCommand(
    "Ordered List",
    CommandGroup.BASIC_BLOCKS,
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const listItem = editor.schema.node("listItem", {}, paragraph);
      const node = editor.schema.node("orderedList", {}, listItem);

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["ol", "orderedlist"],
    OrderedList,
    "Used to display an ordered (enumerated) list item"
  ),

  // Command for creating a blockquote
  blockquote: new SlashCommand(
    "Block Quote",
    CommandGroup.BASIC_BLOCKS,
    (editor, range) => {
      const paragraph = editor.schema.node("paragraph");
      const node = editor.schema.node("blockquote", {}, paragraph);

      editor
        .chain()
        .replaceRangeCustom(range, node)
        .focus()
        .scrollIntoView()
        .run();

      return true;
    },
    ["quote", "blockquote"],
    QuoteIcon,
    "Used to make a quote stand out",
    "Ctrl+Shift+B"
  ),

  // Command for creating a horizontal rule
  horizontalRule: new SlashCommand(
    "Horizontal Rule",
    CommandGroup.BASIC_BLOCKS,
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
        .focus()
        .scrollIntoView()
        .run();
      return true;
    },
    ["hr", "horizontalrule"],
    SeparatorIcon,
    "Used to separate sections with a horizontal line"
  ),

  // Command for creating a table
  table: new SlashCommand(
    "Table",
    CommandGroup.BASIC_BLOCKS,
    (editor, range) => {
      editor.chain().focus().deleteRange(range).run();
      editor
        .chain()
        .focus()
        .insertTable({ rows: 1, cols: 2 })
        .scrollIntoView()
        .run();
      return true;
    },
    ["table", "database"],
    RiTableLine,
    "Used to create a simple table"
  ),
};

export default defaultCommands;
