import { BubbleMenu, Editor } from "@tiptap/react";
import React, { MouseEventHandler } from "react";
import styles from "./InlineMenu.module.css";
import Tippy from "@tippyjs/react";
import "tippy.js/themes/material.css";
import "tippy.js/dist/tippy.css";

type InlineMenuProps = { editor: Editor };
type MenuButtonProps = {
  editor: Editor;
  name: string;
  onClick: MouseEventHandler;
};

const boldName = "bold";
const italicName = "italic";
const strikeName = "strike";
const codeName = "code";
const underlineName = "underline";

const tooltips: { [key: string]: JSX.Element } = {
  [boldName]: styledTooltip("Bold", "Ctrl+B"),
  [italicName]: styledTooltip("Italic", "Ctrl+I"),
  [strikeName]: styledTooltip("Strikethrough", "Ctrl+Shift+X"),
  [codeName]: styledTooltip("Inline Code", "Ctrl+E"),
  [underlineName]: styledTooltip("Underline", "Ctrl+U"),
};

function styledTooltip(mainText: string, secondaryText?: string) {
  return (
    <div className={styles.buttonTooltip}>
      <div className={styles.mainText}>{mainText}</div>
      <div className={styles.secondaryText}>{secondaryText}</div>
    </div>
  );
}

/**
 * The button that shows in the inline menu.
 *
 * __When adding new marks(menu items)__
 * - add the mark name to the constants above
 * - and provide tooltip text
 */
class InlineMenuButton extends React.Component<MenuButtonProps> {
  render() {
    const name = this.props.name;
    return (
      <Tippy content={tooltips[name]} theme="material">
        <button
          onClick={this.props.onClick}
          className={this.props.editor.isActive(name) ? styles.isActive : ""}
          id={"inlineMenuButton-" + name}>
          {name}
        </button>
      </Tippy>
    );
  }
}

class InlineMenu extends React.Component<InlineMenuProps> {
  render() {
    return (
      <BubbleMenu className={styles.BubbleMenu} editor={this.props.editor}>
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleBold().run()}
          name={boldName}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleItalic().run()}
          name={italicName}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleStrike().run()}
          name={strikeName}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleCode().run()}
          name={codeName}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() =>
            this.props.editor.chain().focus().toggleUnderline().run()
          }
          name={underlineName}
        />
      </BubbleMenu>
    );
  }
}

export default InlineMenu;
