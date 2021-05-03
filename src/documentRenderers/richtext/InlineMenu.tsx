import { BubbleMenu, Editor, EditorContent } from "@tiptap/react";
import "./css/inlineMenu.css";
const ACTIVE_CSS_CLASS = "is-active";

export default (editor: Editor) => {
  return (
    editor && (
      <BubbleMenu editor={editor} keepInBounds={true} className="bubble-menu">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? ACTIVE_CSS_CLASS : ""}>
          bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? ACTIVE_CSS_CLASS : ""}>
          italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? ACTIVE_CSS_CLASS : ""}>
          strike
        </button>
      </BubbleMenu>
    )
  );
};
