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
      Bold,
      Code,
      Italic,
      Strike.extend({
        addPasteRules() {
          const pasteRegex = /(?:^|\s)((?:~)((?:[^~]+))(?:~))/gm;
          return [markPasteRule(pasteRegex, this.type)];
        },
      }),
      Underline,

      // custom blocks:
      ImageBlock,
      BlockQuoteBlock.extend({
        addPasteRules() {
          const editor = this.editor;
          return [markdownBlockQuote(editor, new RegExp(`> `), this.type)];
        },
      }),
      CodeBlockBlock.extend({
        addPasteRules() {
          const editor = this.editor;
          return [
            markdownCodeBlock(editor, new RegExp(`\\s{4}|\t`), "codeBlock"),
          ];
        },
      }),
      HeadingBlock.extend({
        addPasteRules() {
          const editor = this.editor;
          console.log("heading paste rules");
          return [
            markdownHeadings(editor, new RegExp(`(#{1,6})\\s`), this.type),
          ];
        },
      }),
      HorizontalRuleBlock.extend({
        addPasteRules() {
          const editor = this.editor;
          return [
            markdownPasteRuleHorizontal(
              editor,
              new RegExp(`( ?[-_*]){3,}\s*`),
              "horizontalRule"
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
          const editor = this.editor;
          return [markdownBulletList(editor, new RegExp(` *[\-\+\*] `))];
        },
      }),
      OrderedList,
      TableCell,
      TableHeader,
      TableRow,

      // This needs to be at the bottom of this list, because Key events (such as enter, when selecting a /command),
      // should be handled before Enter handlers in other components like splitListItem
      SlashCommandExtension.configure({
        commands: {},
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
