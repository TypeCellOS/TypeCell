import Bold from "@tiptap/extension-bold";
import Blockquote from "@tiptap/extension-blockquote";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import DropCursor from "./extensions/customdropcursor/index";
import FloatingMenu from "@tiptap/extension-floating-menu";
import GapCursor from "@tiptap/extension-gapcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import { useEditor, EditorContent } from "@tiptap/react";

import { Slice } from "prosemirror-model"
import { EditorView } from "prosemirror-view"

import { observer } from "mobx-react-lite";
import React from "react";

import { DocumentResource } from "../../store/DocumentResource";
import TypeCellNode from "./extensions/typecellnode";
import Draggable from "./DraggableNode";

import "./RichTextStyle.css"

type Props = {
  document: DocumentResource;
};
const RichTextRenderer: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    extensions: [
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      Document,
      DropCursor,
      HardBreak,
      Heading,
      Paragraph,
      Text,

      // TypeCellNode,
      Draggable,
    ],
    editorProps: {
      attributes: {
        class: "editor"
      },
      handleDrop(view: EditorView, event: Event, slice: Slice, moved: boolean) {
        const nodeType = Object(event).target.className;
        return nodeType != "ProseMirror editor ProseMirror-hideselection";
      },
    },
    content: `
      <div>
        <draggable>
          Item 1
        </draggable>
        <draggable>
          Item 2
        </draggable>
        <draggable>
          Item 3
        </draggable>
        <draggable>
          Item 4
        </draggable>
      </div>
      `,
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextRenderer;
