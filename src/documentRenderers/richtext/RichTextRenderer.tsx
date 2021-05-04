import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useEditor, EditorContent } from "@tiptap/react";
import { observer } from "mobx-react-lite";
import React from "react";
import { mergeAttributes } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { DocumentResource } from "../../store/DocumentResource";
import TypeCellNode from "./extensions/typecellnode";
import styles from "./RichTextRenderer.module.css";

type Props = {
  document: DocumentResource;
};

function deamon() {
  const registerListeners = () => {
    document.querySelectorAll(".unfinished").forEach((handle) => {
      handle.classList.remove("unfinished");
      handle.addEventListener("click", (event) => {
        if (handle.parentElement) {
          handle.parentElement.remove();
        }
      });
    });
  };
  setInterval(registerListeners, 1000);
}

const RichText: React.FC<Props> = observer((props) => {
  const editor = useEditor({
    onCreate: ({ editor }) => {
      deamon();
    },
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    extensions: [
      Document,
      Text,
      Paragraph.extend({
        addAttributes() {
          return {
            blockType: {
              renderHTML: (attributes) => {
                return {
                  class: `tiptap-${attributes.blockType}`,
                  style: `border: solid grey 0.1em`,
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
            mergeAttributes(HTMLAttributes, {
              class: `${styles.blockish}`,
            }),
            [
              "div",
              {
                class: `${styles["handle"]} unfinished`,
              },
              " ⁞ ",
            ],
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
      CodeBlock.extend({
        addKeyboardShortcuts() {
          return {
            "Mod-p": () => this.editor.commands.toggleCodeBlock(),
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

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichText;
