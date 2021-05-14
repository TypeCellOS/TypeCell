import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { DocumentResource } from "../../store/DocumentResource";

// Extensions
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import DropCursor from "@tiptap/extension-dropcursor";
import Placeholder from "@tiptap/extension-placeholder";

import InlineMenu from "./InlineMenu";
import SlashCommandExtension from "./extensions/slashcommand";

// Marks
import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";

import { Underline } from "./extensions/marks/Underline";

// Nodes
import BlockQuote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

import BlockQuoteBlock from "./extensions/blocktypes/BlockQuoteBlock";
import BulletListBlock from "./extensions/blocktypes/BulletListBlock";
import CodeBlockBlock from "./extensions/blocktypes/CodeBlockBlock";
import { DocumentTopNode } from "./extensions/blocktypes/DocumentTopNode";
import HeadingBlock from "./extensions/blocktypes/HeadingBlock";
import HorizontalRuleBlock from "./extensions/blocktypes/HorizontalRuleBlock";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import ListItemBlock from "./extensions/blocktypes/ListItemBlock";
import OrderedListBlock from "./extensions/blocktypes/OrderedListBlock";
import ParagraphBlock from "./extensions/blocktypes/ParagraphBlock";
import ParagraphPlainBlock from "./extensions/blocktypes/ParagraphPlainBlock";
import TypeCellNode from "./extensions/typecellnode";

import "./RichTextRenderer.css";
import TableMenu from "./TableMenu";
import TableBlock from "./extensions/blocktypes/Table";
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
    extensions: [
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      DropCursor,
      Placeholder.configure({
        placeholder: "Use '/' to insert a new block.",
        showOnlyCurrent: false,
      }),
      SlashCommandExtension.configure({
        commands: {},
      }),

      Bold,
      Code,
      Italic,
      Strike,
      Underline,

      BlockQuote,
      BulletList,
      CodeBlock,
      Document,
      HardBreak,
      Heading,
      HorizontalRule,
      Image,
      ListItem,
      OrderedList,
      Paragraph,
      Text,

      BlockQuoteBlock,
      BulletListBlock,
      CodeBlockBlock,
      DocumentTopNode,
      HeadingBlock,
      HorizontalRuleBlock,
      ImageBlock,
      ListItemBlock,
      OrderedListBlock,
      ParagraphBlock,
      ParagraphPlainBlock,
      Underline,

      TableBlock,
      TableCell,
      TableHeader,
      TableRow,

      // TypeCellNode,
    ],
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
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {editor != null ? <InlineMenu editor={editor} /> : null}
      {editor != null ? <TableMenu editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextRenderer;
