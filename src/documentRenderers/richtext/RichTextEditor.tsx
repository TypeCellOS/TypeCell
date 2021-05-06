import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { observer } from "mobx-react-lite";
import React from "react";

import { DocumentResource } from "../../store/DocumentResource";
import { Action } from "./RichTextConsole";
import TypeCellNode from "./extensions/typecellnode";
import styles from "./RichTextRenderer.module.css";
import SideMenu from "./RichTextSideMenu";
import Handle from "./RichTextHandle";

// Editor
type RichTextEditorProps = {
  document: DocumentResource;
  id: string;
  dispatcher: React.Dispatch<Action>;
};
/**
 * This Component encapsulates a block instance
 */
const RichTextEditor: React.FC<RichTextEditorProps> = observer((props) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      //console.log(editor.getJSON());
    },
    extensions: [
      Document.extend({
        content: "block",
      }),
      Text,
      Paragraph.extend({
        addAttributes() {
          return {
            blockType: {
              renderHTML: (attributes) => {
                return {
                  class: `tiptap-${attributes.blockType}`,
                };
              },
              default: "paragraph",
            },
          };
        },
        // @ts-ignore
        renderHTML({ HTMLAttributes }) {
          //console.log(HTMLAttributes);
          return [
            "div",
            HTMLAttributes,
            [
              "p",
              mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: `${styles["block-content"]}`,
              }),
              0,
            ],
          ];
        },
        // @ts-ignore
        addKeyboardShortcuts() {
          return {
            "Mod-Alt-p": () =>
              // @ts-ignore
              this.editor.commands.deleteNode(),
          };
        },
      }),
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
      "<p>This text is in a TipTap editor, feel free to change it. Live collaboration is also enabled.</p>",
  });

  const ID: string = `${props.id}`;
  return (
    <div id={ID} className={`manifest ${styles["instance"]}`}>
      <SideMenu id={ID} dispatcher={props.dispatcher}></SideMenu>
      <div
        style={{ width: "80%", margin: "0px auto" }}
        className={`manifest ${styles["blockish"]}`}>
        <Handle id={ID}></Handle>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export default RichTextEditor;
