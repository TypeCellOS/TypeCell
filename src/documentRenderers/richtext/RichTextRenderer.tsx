import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent } from "@tiptap/react";
import { defaultExtensions } from "@tiptap/starter-kit";
import { observer } from "mobx-react-lite";
import React from "react";

import { DocumentResource } from "../../store/DocumentResource";
import { Underline } from "./extensions/marks/Underline";
import TypeCellNode from "./extensions/typecellnode";
import addInlineMenu from "./InlineMenu";

type Props = {
  document: DocumentResource;
};
const RichText: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    extensions: [
      ...defaultExtensions(),
      Underline,

      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      TypeCellNode,
    ],
    content:
      "This text is in a TipTap editor, feel free to change it. Live collaboration is also enabled.",
  });

  if (editor != null) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {addInlineMenu(editor)}
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichText;
