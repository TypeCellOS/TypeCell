import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { observer } from "mobx-react-lite";
import React from "react";

import { DocumentResource } from "../../store/DocumentResource";
import { Underline } from "./extensions/marks/Underline";
import SlashCommandExtension from "./extensions/slashcommand";
import InlineMenu from "./InlineMenu";

import "./RichTextRenderer.css";

type Props = {
  document: DocumentResource;
};
const RichText: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      // console.log(editor.getJSON());
    },
    extensions: [
      StarterKit,
      Underline,

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

      // TypeCellNode,
      SlashCommandExtension.configure({
        commands: {},
      }),
    ],
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {editor != null ? <InlineMenu editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichText;
