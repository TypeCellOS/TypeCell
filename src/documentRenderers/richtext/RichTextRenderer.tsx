// Unfortunately can't use TipTap's starter-kit since the code for drag handles needed to be changed
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
import { useEditor, EditorContent, Extension } from "@tiptap/react";

import { Slice, Fragment, Node } from "prosemirror-model"
import { Plugin, Transaction, EditorState } from "prosemirror-state";

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

  // This seems like bad practice, but I'm not sure how else to revert to the previous state if a transaction rejects.
  let prevState: EditorState = new EditorState();

  // Ensures that blocks can only be moved between each other and not into each other.
  const DragHandler = Extension.create({
    name: "dragHandler",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          /**
           * Runs on each transaction that is applied to the document, returning false if the transaction should be
           * blocked or true otherwise. The function only returns false if the transaction causes a draggable block to
           * be moved into another draggable block.
           * @param tr    The incoming transaction.
           * @param state The updated editor state following the transaction.
           */
          filterTransaction(tr: Transaction, state: EditorState) {
            const document: Node = tr.doc;
            let containsDraggable = false;

            // Iterates over each block in document.
            document.forEach(function f(node: Node, offset: number, index: number) {
              // Iterates over descendants of each block.
              node.descendants(function f(node: Node, pos: number, parent: Node) {
                containsDraggable = containsDraggable || node.type.name == "draggable";
              })
            })

            // Reverts to previous state if draggable block found inside other draggable block.
            if (!containsDraggable) {
              prevState = state;
            } else {
              state.doc = prevState.doc;
            }

            return !containsDraggable
          }
        })
      ]
    }
  })

  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    extensions: [
      DragHandler,
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

      TypeCellNode,
      Draggable,
    ],
    editorProps: {
      attributes: {
        class: "editor"
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
