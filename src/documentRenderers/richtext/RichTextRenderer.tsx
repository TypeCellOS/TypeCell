import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Link from "@tiptap/extension-link";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import React from "react";
import { DocumentResource } from "../../store/DocumentResource";
import { AutoId } from "./extensions/autoid/AutoId";
import { TrailingNode } from "./extensions/trailingnode";
import {
  BlockQuoteBlock,
  HeadingBlock,
  HorizontalRuleBlock,
  IndentItemBlock,
  ListItemBlock,
  ParagraphBlock,
  BulletList,
  OrderedList,
  CodeBlockBlock,
} from "./extensions/blocktypes";
import { TableBlock } from "./extensions/blocktypes/TableBlock";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import IndentGroup from "./extensions/blocktypes/IndentGroup";
import { Underline } from "./extensions/marks/Underline";
import { Mention, MentionType } from "./extensions/mentions/Mention";
import { MentionsExtension } from "./extensions/mentions/MentionsExtension";
import SlashCommandExtension from "./extensions/slashcommand";
import "./RichTextRenderer.css";
import InlineMenu from "./menus/InlineMenu";
import TableMenu from "./menus/TableInlineMenu";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { Placeholder } from "@tiptap/extension-placeholder";
import multipleLineMarkdownRuleBuilder from "./extensions/markdownPasteRules/multiple/markdownMultipleLines";

// This is a temporary array to show off mentions
const PEOPLE = [
  new Mention("Pepijn Vunderink", MentionType.PEOPLE),
  new Mention("Yousef El-Dardiri", MentionType.PEOPLE),
  new Mention("Chong Zhao", MentionType.PEOPLE),
  new Mention("Matthew Lipski", MentionType.PEOPLE),
  new Mention("Emre Agca", MentionType.PEOPLE),
  new Mention("Nikolay Zhlebinkov", MentionType.PEOPLE),
];

type Props = {
  document: DocumentResource;
};
const RichTextRenderer: React.FC<Props> = (props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      // console.log(editor.getJSON());
    },
    onSelectionUpdate: ({ editor }) => {
      // console.log(editor.getJSON());
      // console.log(editor.state.selection);
    },
    extensions: [
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      // DropCursor,
      // Even though we implement our own placeholder logic in Blocks, we
      // still need the placeholder extension to make sure nodeviews
      // are re-rendered when they're empty or when the anchor changes.
      Placeholder.configure({
        placeholder: "", // actual placeholders are defined per block
        showOnlyCurrent: true, // use showOnlyCurrent to make sure the nodeviews are rerendered when cursor moves
      }),

      AutoId,
      HardBreak,

      // basics:
      Text,
      Document,

      // marks:
      Bold,
      Code,
      Italic,
      Strike,
      Underline,
      Link,

      // custom blocks:
      ImageBlock,
      BlockQuoteBlock.configure({ placeholder: "Empty quote" }),
      CodeBlockBlock,
      HeadingBlock.configure({ placeholder: "Heading" }),
      HorizontalRuleBlock,
      ParagraphBlock.configure({
        placeholder: "Enter text or type '/' for commands",
        placeholderOnlyWhenSelected: true,
      }),
      ListItemBlock.configure({ placeholder: "List item" }),
      TableBlock,
      IndentItemBlock.configure({
        HTMLAttributes: {
          class: "indent",
        },
      }),
      BulletList,
      OrderedList,

      // custom containers:
      IndentGroup,

      // from tiptap (unmodified)
      TableCell,
      TableHeader,
      TableRow,

      // This needs to be at the bottom of this list, because Key events (such as enter, when selecting a /command),
      // should be handled before Enter handlers in other components like splitListItem
      SlashCommandExtension.configure({
        // Extra commands can be registered here
        commands: {},
      }),
      MentionsExtension.configure({
        providers: {
          people: (query) => {
            return PEOPLE.filter((mention) => mention.match(query));
          },
        },
      }),
      TrailingNode,
      // TypeCellNode,
    ],
    enableInputRules: true,
    enablePasteRules: true,
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
  });

  return (
    <div>
      {editor != null ? <InlineMenu editor={editor} /> : null}
      {editor != null ? <TableMenu editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextRenderer;
