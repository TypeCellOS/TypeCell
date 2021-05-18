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
  TableBlock,
} from "./extensions/blocktypes";
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
      SlashCommandExtension.configure({
        commands: {},
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

      // custom containers:
      IndentGroup,

      // from tiptap (unmodified)
      BulletList,
      OrderedList,
      TableCell,
      TableHeader,
      TableRow,

      // TypeCellNode,
    ],
    enableInputRules: true,
    enablePasteRules: true,
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
    content: `
    <p>a paragraph</p>
    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Rank</th>
          <th>Radius</th>
        </tr>
        <tr>
          <td>Mercury</td>
          <td>1</td>
          <td>2440</td>
        </tr>
        <tr>
          <td>Venus</td>
          <td>2</td>
          <td>6052</td>
        </tr>
        <tr>
          <td>Earth</td>
          <td>3</td>
          <td>6371</td>
        </tr>
        <tr>
          <td>Mars</td>
          <td>4</td>
          <td>3390</td>
        </tr>
        <tr>
          <td>Jupiter</td>
          <td>5</td>
          <td>69911</td>
        </tr>
        <tr>
          <td>Saturn</td>
          <td>6</td>
          <td>58232</td>
        </tr>
        <tr>
          <td>Uranus</td>
          <td>7</td>
          <td>25362</td>
        </tr>
        <tr>
          <td>Neptune</td>
          <td>8</td>
          <td>24622</td>
        </tr>
      </tbody>
    </table>
    <p>another paragraph</p>
    `,
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
