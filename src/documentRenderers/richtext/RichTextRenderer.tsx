import React from "react";
import { observer } from "mobx-react-lite";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";

import { DocumentResource } from "../../store/DocumentResource";
import { Underline } from "./extensions/marks/Underline";
import TypeCellNode from "./extensions/typecellnode";
import InlineMenu from "./InlineMenu";
import BlockQuoteBlock from "./extensions/blocktypes/BlockQuoteBlock";
import BulletListBlock from "./extensions/blocktypes/BulletListBlock";
import CodeBlockBlock from "./extensions/blocktypes/CodeBlockBlock";
import HeadingBlock from "./extensions/blocktypes/HeadingBlock";
import HorizontalRuleBlock from "./extensions/blocktypes/HorizontalRuleBlock";
import ImageBlock from "./extensions/blocktypes/ImageBlock";
import ListItemBlock from "./extensions/blocktypes/ListItemBlock";
import OrderedListBlock from "./extensions/blocktypes/OrderedListBlock";
import ParagraphBlock from "./extensions/blocktypes/ParagraphBlock";
import SlashCommandExtension from "./extensions/slashcommand";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import CustomTable from "./extensions/blocktypes/Table";
import Paragraph from "@tiptap/extension-paragraph";
import Tippy from "@tippyjs/react";

import "./RichTextRenderer.css";

type Props = {
  document: DocumentResource;
};
const RichTextRenderer: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      // console.log(editor.getJSON());
    },
    extensions: [
      StarterKit,
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      Placeholder.configure({
        placeholder: "Use '/' to insert a new block.",
        showOnlyCurrent: true,
      }),
      SlashCommandExtension.configure({
        commands: {},
      }),
      // TypeCellNode,
      BlockQuoteBlock,
      BulletListBlock,
      CodeBlockBlock,
      HeadingBlock,
      HorizontalRuleBlock,
      ImageBlock,
      ListItemBlock,
      OrderedListBlock,
      ParagraphBlock,
      Underline,
      CustomTable,
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
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextRenderer;
