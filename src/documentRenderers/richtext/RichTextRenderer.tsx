import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent } from "@tiptap/react";
import { defaultExtensions } from "@tiptap/starter-kit";
import { observer } from "mobx-react-lite";
import React from "react";

import { DocumentResource } from "../../store/DocumentResource";
import TypeCellNode from "./extensions/typecellnode";
import DraggableNode from "./DraggableNode";
import BoundaryNode from "./BoundaryNode";

import "./RichTextStyle.css"

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

      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: { name: "Hello", color: "#f783ac" },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
      TypeCellNode,
      DraggableNode,
      BoundaryNode
    ],
    editorProps: {
      attributes: {
        class: "editor"
      }
    },
    content: `
      <div>
        <div class="boundary">boundary</div>
        <div class="draggable-item">
          <div class="boundary">boundary</div>
          Item 1
          <div class="draggable-item">
            <div class="boundary">boundary</div>
            Item 2
            <div class="boundary">boundary</div>
          </div>
          <div class="draggable-item">
            <div class="boundary">boundary</div>
            Item 3
            <div class="boundary">boundary</div>
          </div>
          <div class="boundary">boundary</div>
        </div>
        <div class="draggable-item">
          <div class="boundary">boundary</div>
          Item 4
          <div class="boundary">boundary</div>
        </div>
        <div class="boundary">boundary</div>
      </div>`,
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichText;
