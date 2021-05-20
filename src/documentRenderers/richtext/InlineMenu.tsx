import { BubbleMenu, Editor } from "@tiptap/react";
import { Selection, NodeSelection } from "prosemirror-state";
import React, { MouseEventHandler } from "react";
import styles from "./InlineMenu.module.css";
import Tippy from "@tippyjs/react";
import LinkForm from "./LinkForm"
import { Underline } from "./extensions/marks/Underline";

type InlineMenuProps = { editor: Editor };
type MenuButtonProps = {
  editor: Editor;
  styleDetails: StyleDetails;
  onClick: MouseEventHandler;
};
type LinkMenuButtonProps = {
  editor: Editor;
  styleDetails: StyleDetails;
}

/**
 * [name] has to be the same as the name in the defining Mark
 */
type StyleDetails = {
  name: string;
  mainTooltip: string;
  secondaryTooltip: string;
  // When we implement icons they should also go here
};

const bold: StyleDetails = {
  name: "bold",
  mainTooltip: "Bold",
  // This will change to a variable if custom shortcuts are implemented
  secondaryTooltip: "Ctrl+B",
};

const italic: StyleDetails = {
  name: "italic",
  mainTooltip: "Italic",
  secondaryTooltip: "Ctrl+I",
};

const strike: StyleDetails = {
  name: "strike",
  mainTooltip: "Strikethrough",
  secondaryTooltip: "Ctrl+Shift+X",
};

const code: StyleDetails = {
  name: "code",
  mainTooltip: "Inline Code",
  secondaryTooltip: "Ctrl+E",
};

const underline: StyleDetails = {
  name: Underline.name,
  mainTooltip: "Underline",
  secondaryTooltip: "Ctrl+U",
};

const link: StyleDetails = {
  name: "link",
  mainTooltip: "Link",
  secondaryTooltip: "Ctrl+K",
}

function styledTooltip(mainText: string, secondaryText?: string) {
  return (
    <div className={styles.buttonTooltip}>
      <div className={styles.mainText}>{mainText}</div>
      <div className={styles.secondaryText}>{secondaryText}</div>
    </div>
  );
}

/**
 * The tooltip component that is rendered for the tippy content prop
 */
class ToolTip extends React.Component<StyleDetails> {
  render() {
    return (
      <div className={styles.buttonTooltip}>
        <div className={styles.mainText}>
          {this.props.mainTooltip}
        </div>
        <div className={styles.secondaryText}>
          {this.props.secondaryTooltip}
        </div>
      </div>
    )
  }
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
    const name = this.props.styleDetails.name;

    return (
      <Tippy content={<ToolTip {...this.props.styleDetails} />} theme="material">
        <button
          onClick={this.props.onClick}
          className={this.props.editor.isActive(name) ? styles.isActive : ""}
          id={"inlineMenuButton-" + name}>
          {name.toUpperCase()[0]}
        </button>
      </Tippy>
    );
  }
}

/**
 * The link button that shows in the inline menu
 * 
 * The link button has an additional menu when clicked on,
 * which is why it is needed to be rendered differently from the other
 * menu buttons. The clicking even is handled by the inner Tippy tag.
 */
class LinkInlineMenuButton extends React.Component<LinkMenuButtonProps> {
  render() {
    return (
      <Tippy content={<ToolTip {...this.props.styleDetails}/>} theme="material">
        <Tippy
          content={<LinkForm editor={this.props.editor} />}
          trigger={"click"}
          interactive={true}
          maxWidth={500}>
          <button
            className={this.props.editor.isActive("link") ? styles.isActive : ""}
            id={"inlineMenuButton-link"}>
            L
          </button>
        </Tippy>
      </Tippy>
    )
  }
}

/**
 * The bubble menu which renders InlineMenuButtons and a LinkInlineMenu
 */
class InlineMenu extends React.Component<InlineMenuProps> {
  render() {
    // Renders an empty menu if a block is selected.
    if (this.props.editor.state.selection instanceof NodeSelection) {
      return (
        <BubbleMenu className={styles.hidden} editor={this.props.editor} />
      );
    }

    return (
      <BubbleMenu className={styles.BubbleMenu} editor={this.props.editor}>
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleBold().run()}
          styleDetails={bold}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleItalic().run()}
          styleDetails={italic}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleStrike().run()}
          styleDetails={strike}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleCode().run()}
          styleDetails={code}
        />
        <InlineMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleUnderline().run()}
          styleDetails={underline}
        />
        <LinkInlineMenuButton
          editor={this.props.editor}
          styleDetails={link}
        />
      </BubbleMenu>
    );
  }
}

export default InlineMenu;
