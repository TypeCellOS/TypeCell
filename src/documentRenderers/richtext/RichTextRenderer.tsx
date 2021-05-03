import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import { defaultExtensions } from "@tiptap/starter-kit";
import { observer } from "mobx-react-lite";
import React from "react";

import { DocumentResource } from "../../store/DocumentResource";
import TypeCellNode from "./extensions/typecellnode";
import DraggableNode from "./DraggableNode";
import { Paragraph } from "@tiptap/extension-paragraph"

type Props = {
  document: DocumentResource;
};

const Drag = Paragraph.extend({
  draggable: true,
})


const RichText: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    extensions: [
      ...defaultExtensions(),
      // Drag,

      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      TypeCellNode,
      DraggableNode,
    ],
    content: `
        <div>
          <div data-type="draggable-item">1</div>
          <div data-type="draggable-item">2</div>
          <div data-type="draggable-item">3</div>
        </div>
<!--        <div>-->
<!--            <p>Drag 1</p>-->
<!--            <p>Drag 2</p>-->
<!--            <p>Drag 3</p>-->
<!--        </div>-->
    `,
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichText;
