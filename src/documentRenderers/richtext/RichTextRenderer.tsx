import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
// import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import React from "react";
import { DocumentResource } from "../../store/DocumentResource";
import { AutoId } from "./extensions/autoid/AutoId";
import {
  BlockQuoteBlock,
  CodeBlockBlock,
  HeadingBlock,
  HorizontalRuleBlock,
  IndentItemBlock,
  ListItemBlock,
  ParagraphBlock,
} from "./extensions/blocktypes";
import { TableBlock } from "./extensions/blocktypes/TableBlock";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import IndentGroup from "./extensions/blocktypes/IndentGroup";
import { Underline } from "./extensions/marks/Underline";
import { Mention, MentionType } from "./extensions/mentions/Mention";
import { MentionsExtension } from "./extensions/mentions/MentionsExtension";
import SlashCommandExtension from "./extensions/slashcommand";
import InlineMenu from "./InlineMenu";
import "./RichTextRenderer.css";
import RefBlock from "./extensions/blocktypes/RefBlock";
import TableMenu from "./TableMenu";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Collaboration from "./extensions/collaboration";

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
      Placeholder.configure({
        placeholder: "Use '/' to insert a new block.",
        showOnlyCurrent: false,
      }),
      // TypeCellNode,

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

      // custom blocks:
      ImageBlock,
      BlockQuoteBlock,
      CodeBlockBlock,
      HeadingBlock,
      HorizontalRuleBlock,
      ParagraphBlock,
      ListItemBlock,
      TableBlock,
      IndentItemBlock.configure({
        HTMLAttributes: {
          className: "indent",
        },
      }),
      RefBlock,
      // custom containers:
      IndentGroup,

      // from tiptap (unmodified)
      BulletList,
      OrderedList,
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
