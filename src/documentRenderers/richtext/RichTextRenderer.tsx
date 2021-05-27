import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Typography from "@tiptap/extension-typography";
import { EditorContent, useEditor } from "@tiptap/react";
import { markPasteRule } from "@tiptap/core";
import React from "react";
import { DocumentResource } from "../../store/DocumentResource";
import { AutoId } from "./extensions/autoid/AutoId";
import {
  BlockQuoteBlock,
  HeadingBlock,
  HorizontalRuleBlock,
  IndentItemBlock,
  ListItemBlock,
  ParagraphBlock,
} from "./extensions/blocktypes";
import { TableBlock } from "./extensions/blocktypes/TableBlock";
import { CodeBlockBlock } from "./extensions/blocktypes/CodeBlockBlock";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import IndentGroup from "./extensions/blocktypes/IndentGroup";
import { Underline } from "./extensions/marks/Underline";
import { Mention, MentionType } from "./extensions/mentions/Mention";
import { MentionsExtension } from "./extensions/mentions/MentionsExtension";
import SlashCommandExtension from "./extensions/slashcommand";
import InlineMenu from "./InlineMenu";
import "./RichTextRenderer.css";
import TableMenu from "./TableMenu";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import markdownHeadings from "./extensions/markdownPasteRules/Headings";
import markdownPasteRuleHorizontal from "./extensions/markdownPasteRules/Horizontal";
import markdownBlockQuote from "./extensions/markdownPasteRules/BlockQuote";
import markdownCodeBlock from "./extensions/markdownPasteRules/CodeBlock";
import markdownBulletList from "./extensions/markdownPasteRules/BulletList";
import markdownOrderedList from "./extensions/markdownPasteRules/OrderedList";

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

      AutoId,
      HardBreak,

      // basics:
      Text,
      Document,

      // marks:
      Bold.extend({
        addPasteRules() {
          // this is **bold** text
          // this is __bold__ text
          const pasteRegexAsterisk = /(?:^|\s)((?:\*\*)((?:[^\*]+))(?:\*\*))/gm;
          const pasteRegexUnderscore = /(?:^|\s)((?:__)((?:[^_]+))(?:__))/gm;
          return [
            markPasteRule(pasteRegexAsterisk, this.type),
            markPasteRule(pasteRegexUnderscore, this.type),
          ];
        },
      }),
      Code.extend({
        addPasteRules() {
          // this is `code` text
          const pasteRegex = /(?:^|\s)((?:\`)((?:[^\`]+))(?:\`))/gm;
          return [markPasteRule(pasteRegex, this.type)];
        },
      }),
      Italic.extend({
        addPasteRules() {
          // this is *bold* text
          // this is _bold_ text
          const pasteRegexAsterisk = /(?:^|\s)((?:\*)((?:[^\*]+))(?:\*))/gm;
          const pasteRegexUnderscore = /(?:^|\s)((?:_)((?:[^_]+))(?:_))/gm;
          return [
            markPasteRule(pasteRegexAsterisk, this.type),
            markPasteRule(pasteRegexUnderscore, this.type),
          ];
        },
      }),
      Strike.extend({
        addPasteRules() {
          // this is ~~strike~~ text
          const pasteRegex = /^(?:^|\s)((?:~~)((?:[^~]+))(?:~~))/gm;
          return [markPasteRule(pasteRegex, this.type)];
        },
      }),
      Underline,

      // custom blocks:
      ImageBlock,
      BlockQuoteBlock.extend({
        addPasteRules() {
          // any consecutive lines that start with > and a space
          const editor = this.editor;
          return [markdownBlockQuote(editor, new RegExp(`^> `))];
        },
      }),
      CodeBlockBlock.extend({
        addPasteRules() {
          // any consecutive lines that start with a tab or 4 spaces
          const editor = this.editor;
          return [markdownCodeBlock(editor, new RegExp(`^\\s{4}|\t`))];
        },
      }),
      HeadingBlock.extend({
        addPasteRules() {
          // any consecutive lines that start with 1-6 # and a space
          const editor = this.editor;
          return [markdownHeadings(editor, new RegExp(`^(#{1,6})\\s`))];
        },
      }),
      HorizontalRuleBlock.extend({
        addPasteRules() {
          // any consecutive lines that start with 3 or more - _ or *
          const editor = this.editor;
          return [
            markdownPasteRuleHorizontal(
              editor,
              new RegExp(`^( ?[-_*]){3,}\\s*`)
            ),
          ];
        },
      }),
      ParagraphBlock,
      ListItemBlock,
      TableBlock,
      IndentItemBlock.configure({
        HTMLAttributes: {
          className: "indent",
        },
      }),

      // custom containers:
      IndentGroup,

      // from tiptap (unmodified)
      BulletList.extend({
        addPasteRules() {
          // any consecutive lines that start with - + or * and a space
          const editor = this.editor;
          return [markdownBulletList(editor, new RegExp(`^\\s?[\-\+\*] `))];
        },
      }),
      OrderedList.extend({
        addPasteRules() {
          // any consecutive lines that start with a number, a period and a space
          const editor = this.editor;
          return [markdownOrderedList(editor, new RegExp(`^\\d+. `))];
        },
      }),
      TableCell,
      TableHeader,
      TableRow,
      Typography,

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
