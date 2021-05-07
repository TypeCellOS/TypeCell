import React from "react";
import { observer } from "mobx-react-lite";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import { DocumentResource } from "../../store/DocumentResource";

import "./RichTextStyle.css"
import ParagraphBlock from "./ParagraphBlock";

type Props = {
  document: DocumentResource;
};
const RichTextRenderer: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
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
      ParagraphBlock,
    ],
    editorProps: {
      attributes: {
        class: "editor"
      },
    },

    content: `
      <div>
        <p>Item 1</p>
        <p>Item 2</p>
        <p>Item 3</p>
        <p>Item 4</p>
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
