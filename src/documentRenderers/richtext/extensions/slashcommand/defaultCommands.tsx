import { TextSelection } from "prosemirror-state";
import { CommandGroup, SlashCommand } from "./SlashCommand";
import { ReactComponent as UnorderedList } from "../../icons/list-unordered.svg";
import { ReactComponent as H1 } from "../../icons/h-1.svg";
import { ReactComponent as H2 } from "../../icons/h-2.svg";
import { ReactComponent as H3 } from "../../icons/h-3.svg";
import { ReactComponent as H4 } from "../../icons/h-4.svg";
import { ReactComponent as H5 } from "../../icons/h-5.svg";
import { ReactComponent as H6 } from "../../icons/h-6.svg";
import styles from "./test.module.css";

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
    (
      <H1
        width="40"
        height="40"
        viewBox="-5 -5 50 50"
        enableBackground="white"
        className={styles.icon}
      />
    ),
    "Big section heading"
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
    (
      <div className={styles.icon2}>
        <H2 width="20" height="20" />
      </div>
    )
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
    (
      <div className={styles.icon3}>
        <H3 width="20" height="20" />
      </div>
    )
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
    (
      <div className={styles.icon4}>
        <H4 width="20" height="20" />
      </div>
    )
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
    <H5 />
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
    <H6 />
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
    ["p"]
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
    ["code", "codeblock"]
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
    ["ul", "list", "bulletlist"]
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
    ["ol", "orderedlist"]
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
    ["quote", "blockquote"]
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
    ["hr", "horizontalrule"]
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
    ["table", "database"]
  ),
};

export default defaultCommands;
