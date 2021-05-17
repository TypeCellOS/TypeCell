import { BubbleMenu, Editor } from "@tiptap/react";
import React, { useRef } from "react";
import styles from "./InlineMenu.module.css";
import Tippy from "@tippyjs/react";
import LinkForm from "./LinkForm"

type InlineMenuProps = { editor: Editor };

const InlineMenu: React.FC<InlineMenuProps> = (props: InlineMenuProps) =>{

  const linkRef = useRef();

  return (
    <BubbleMenu className={styles.BubbleMenu} editor={props.editor}>
      <button
        onClick={() => props.editor.chain().focus().toggleBold().run()}
        className={props.editor.isActive("bold") ? styles.isActive : ""}>
        Bold
      </button>
      <button
        onClick={() => props.editor.chain().focus().toggleItalic().run()}
        className={
          props.editor.isActive("italic") ? styles.isActive : ""
        }>
        Italic
      </button>
      <button
        onClick={() => props.editor.chain().focus().toggleStrike().run()}
        className={
          props.editor.isActive("strike") ? styles.isActive : ""
        }>
        Strike
      </button>
      <button
        onClick={() => props.editor.chain().focus().toggleCode().run()}
        className={props.editor.isActive("code") ? styles.isActive : ""}>
        Code
      </button>
      <button
        onClick={() =>
          props.editor.chain().focus().toggleUnderline().run()
        }
        className={
          props.editor.isActive("underline") ? styles.isActive : ""
        }>
        Underline
      </button>
      <Tippy
        // @ts-ignore
        content={<LinkForm editor={props.editor} ref={linkRef}></LinkForm>}
        trigger={"click"}
        placement={"top"}
        interactive={true}>
        <button
          onClick={() =>
            // @ts-ignore
            linkRef.current.toggleExpansion()
          }
          className={
            props.editor.isActive("link") ? styles.isActive : ""
          }>
          Link
        </button>
      </Tippy>
    </BubbleMenu>
  );
}

export default InlineMenu;
