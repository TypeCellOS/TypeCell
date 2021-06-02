import { BubbleMenu, Editor } from "@tiptap/react";
import { TextSelection } from "prosemirror-state";
import React from "react";
import BoldIcon from "remixicon-react/BoldIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import CodeLineIcon from "remixicon-react/CodeLineIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";
import LinkIcon from "remixicon-react/LinkIcon";

import { Underline } from "../extensions/marks/Underline";
import BubbleMenuButton, { ButtonStyleDetails } from "./BubbleMenuButton";
import styles from "./InlineMenu.module.css";
import BubbleMenuLinkButton from "./BubbleMenuLinkButton";

type InlineMenuProps = { editor: Editor };

const bold: ButtonStyleDetails = {
  markName: "bold",
  mainTooltip: "Bold",
  // This will change to a variable if custom shortcuts are implemented
  secondaryTooltip: "Ctrl+B",
  icon: BoldIcon,
};

const italic: ButtonStyleDetails = {
  markName: "italic",
  mainTooltip: "Italic",
  secondaryTooltip: "Ctrl+I",
  icon: ItalicIcon,
};

const strike: ButtonStyleDetails = {
  markName: "strike",
  mainTooltip: "Strikethrough",
  secondaryTooltip: "Ctrl+Shift+X",
  icon: StrikethroughIcon,
};

const code: ButtonStyleDetails = {
  markName: "code",
  mainTooltip: "Inline Code",
  secondaryTooltip: "Ctrl+E",
  icon: CodeLineIcon,
};

const underline: ButtonStyleDetails = {
  markName: Underline.name,
  mainTooltip: "Underline",
  secondaryTooltip: "Ctrl+U",
  icon: UnderlineIcon,
};

const link: ButtonStyleDetails = {
  markName: "link",
  mainTooltip: "Link",
  secondaryTooltip: "Ctrl+K",
  icon: LinkIcon,
};

class InlineMenu extends React.Component<InlineMenuProps> {
  render() {
    const TOP_DEPTH = 1;

    const resolvedPos = this.props.editor.state.doc.resolve(
      this.props.editor.state.selection.from
    );

    let shouldRender = true;

    // Check for table node
    if (resolvedPos.depth > TOP_DEPTH) {
      const grandParent = resolvedPos.node(resolvedPos.depth - 1);
      if (
        grandParent &&
        grandParent.type.name.toLowerCase().startsWith("table")
      ) {
        shouldRender = false;
      }
    }

    // Check for typecell code editor node
    if (
      resolvedPos.nodeAfter &&
      resolvedPos.nodeAfter.type.name === "typecell"
    ) {
      shouldRender = false;
    }

    // Don't render menu if selection is not a text-selection
    if (!(this.props.editor.state.selection instanceof TextSelection)) {
      shouldRender = false;
    }

    // Either render an empty hidden menu or the actual inline menu
    if (!shouldRender) {
      console.log("Dont render");

      return (
        <BubbleMenu className={styles.hidden} editor={this.props.editor} />
      );
    } else {
      return (
        <BubbleMenu className={styles.bubbleMenu} editor={this.props.editor}>
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() => this.props.editor.chain().focus().toggleBold().run()}
            styleDetails={bold}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() =>
              this.props.editor.chain().focus().toggleItalic().run()
            }
            styleDetails={italic}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() =>
              this.props.editor.chain().focus().toggleStrike().run()
            }
            styleDetails={strike}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() => this.props.editor.chain().focus().toggleCode().run()}
            styleDetails={code}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() =>
              this.props.editor.chain().focus().toggleUnderline().run()
            }
            styleDetails={underline}
          />
          <BubbleMenuLinkButton
            editor={this.props.editor}
            styleDetails={link}
          />
        </BubbleMenu>
      );
    }
  }
}

export default InlineMenu;
