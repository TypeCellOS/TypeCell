import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent } from "@tiptap/react";
import { defaultExtensions } from "@tiptap/starter-kit";
import { observer } from "mobx-react-lite";
import React from "react";
import TypeCellNode from "../../PMTest/TypeCellNode";
import TCDocument from "../../store/TCDocument";


type Props = {
  document: TCDocument;
};
const RichText: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onViewUpdate: ({ editor }) => {
      console.log(editor.getJSON())
    },
    extensions: [...defaultExtensions(),

    CollaborationCursor.configure({
      provider: props.document.webrtcProvider,
      user: { name: 'Hello', color: '#f783ac' },

    }),
    Collaboration.configure({
      fragment: props.document.data,
    }),
      //   TypeCellNode
    ],
    // content: '<p>Hello World! 🌎️</p><react-component></react-component>',
  })

  return <div style={{ maxWidth: 600, margin: "0 auto" }}>
    <EditorContent editor={editor} />
  </div>
});

export default RichText;
