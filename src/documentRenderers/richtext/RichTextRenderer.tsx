import Bold from "@tiptap/extension-bold";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import Code from "@tiptap/extension-code";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import React from "react";
import { DocumentResource } from "../../store/DocumentResource";
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
import { Underline } from "./extensions/marks/Underline";
import SlashCommandExtension from "./extensions/slashcommand";
import InlineMenu from "./InlineMenu";
import "./RichTextRenderer.css";

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
      Placeholder.configure({
        placeholder: "Use '/' to insert a new block.",
        showOnlyCurrent: false,
      }),
      SlashCommandExtension.configure({
        commands: {},
      }),
      DocumentTopNode,
      ParagraphPlainBlock,
      ParagraphBlock,
      BlockQuoteBlock,
      BulletListBlock,
      CodeBlockBlock,
      HeadingBlock,
      HorizontalRuleBlock,
      ImageBlock,
      ListItemBlock,
      OrderedListBlock,
      Underline,
      Code,
      Bold,
      Italic,
      Strike,
      HardBreak,
      Gapcursor,
      Dropcursor,

      // TypeCellNode,
      Text,
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
};

export default RichTextRenderer;
