import { BubbleMenu, Editor } from "@tiptap/react";
import "./css/inlineMenu.css";
const ACTIVE_CSS_CLASS = "is-active";

function addInlineMenu(editor: Editor) {
  return (
    <>
      {editor && (
        <BubbleMenu className="bubble-menu" editor={editor}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? ACTIVE_CSS_CLASS : ""}>
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? ACTIVE_CSS_CLASS : ""}>
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? ACTIVE_CSS_CLASS : ""}>
            Strike
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive("code") ? ACTIVE_CSS_CLASS : ""}>
            Code
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? ACTIVE_CSS_CLASS : ""}>
            Underline
          </button>
        </BubbleMenu>
      )}
    </>
  );
}

export default addInlineMenu;
