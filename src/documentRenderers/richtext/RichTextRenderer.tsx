import React from "react";
import { observer } from "mobx-react-lite";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "./extensions/collaboration";
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

import "./RichTextRenderer.css";
import RefBlock from "./extensions/blocktypes/RefBlock";

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
      RefBlock,
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

      // TypeCellNode,
    ],
    editorProps: {
      attributes: {
        class: "editor",
      },
    },
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {editor != null ? <InlineMenu editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextRenderer;
