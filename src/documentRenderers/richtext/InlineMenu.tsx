import { BubbleMenu, Editor, EditorContent } from "@tiptap/react";
import tippy from "tippy.js";
import "./css/inlineMenu.css";
const ACTIVE_CSS_CLASS = "is-active";

export default (editor: Editor) => {
  return (
    <>
      {editor && (
        <BubbleMenu className="bubble-menu" editor={editor}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}>
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}>
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is-active" : ""}>
            Strike
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </>
  );
};
