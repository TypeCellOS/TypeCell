import { BubbleMenu, Editor, EditorContent } from "@tiptap/react";
import "./css/inlineMenu.css";

export default (editor: Editor) => {
  return (
    <>
      {editor && (
        <BubbleMenu editor={editor} keepInBounds={true} className="bubble-menu">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}>
            bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}>
            italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is-active" : ""}>
            strike
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </>
  );
};
