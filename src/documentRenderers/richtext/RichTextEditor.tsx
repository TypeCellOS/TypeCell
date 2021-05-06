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
import SideMenu from "./SideMenu";

// Editor
type RichTextEditorProps = {
  document: DocumentResource;
  id: string;
  dispatcher: React.Dispatch<Action>;
};
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
        addCommands() {
          return {
            // @ts-ignore
            deleteNode: (attributes) => ({ chain }) => {
              return chain().focus().clearContent().run();
            },
          };
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
// Editor

// Handle
type HandleProps = {
  id: string;
  // dispatcher: React.Dispatch<Action>;
};
const Handle: React.FC<HandleProps> = observer((props) => {
  return (
    <div
      className={`${styles["handle"]}`}
      onClick={(event) => {
        console.log(`clicking a handle...`);
        // @ts-ignore
        const handle: any = event.nativeEvent.target;
        const menu = document.querySelector(`#${props.id} > div`);
        // @ts-ignore
        const display = menu.style.display;
        if (menu && display === "none") {
          const rect = handle.getBoundingClientRect();
          // @ts-ignore
          menu.style.left = `${-999}px`;
          // @ts-ignore
          menu.style.display = "block";
          // @ts-ignore
          menu.style.left = `calc(${rect.left - menu.scrollWidth}px - 2em)`;
          // @ts-ignore
          menu.style.top = `${
            (rect.top + rect.bottom) / 2 - menu.scrollHeight / 2
          }px`;
        } else {
          // @ts-ignore
          menu.style.display = "none";
        }
      }}>
      &nbsp;⁞&nbsp;
    </div>
  );
});
// Handle

export default RichTextEditor;
