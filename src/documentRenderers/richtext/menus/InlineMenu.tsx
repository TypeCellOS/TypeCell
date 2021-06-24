import { BubbleMenu, Editor } from "@tiptap/react";
import { TextSelection } from "prosemirror-state";
import React from "react";
import BoldIcon from "remixicon-react/BoldIcon";
import Chat2LineIcon from "remixicon-react/Chat2LineIcon";
import CodeLineIcon from "remixicon-react/CodeLineIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";
import LinkIcon from "remixicon-react/LinkIcon";
import { CommentStore } from "../extensions/comments/CommentStore";
import { Comment } from "../extensions/marks/Comment";
import { Underline } from "../extensions/marks/Underline";
import { BubbleMenuButton, ButtonStyleDetails } from "./BubbleMenuButton";
import LinkBubbleMenuButton from "./LinkBubbleMenuButton";
import styles from "./InlineMenu.module.css";

type InlineMenuProps = { editor: Editor; commentStore: CommentStore };

export const buttonDetails: { [key: string]: ButtonStyleDetails } = {
  bold: {
    markName: "bold",
    mainTooltip: "Bold",
    // This will change to a variable if custom shortcuts are implemented
    secondaryTooltip: "Ctrl+B",
    icon: BoldIcon,
  },

  italic: {
    markName: "italic",
    mainTooltip: "Italic",
    secondaryTooltip: "Ctrl+I",
    icon: ItalicIcon,
  },

  strike: {
    markName: "strike",
    mainTooltip: "Strikethrough",
    secondaryTooltip: "Ctrl+Shift+X",
    icon: StrikethroughIcon,
  },

  code: {
    markName: "code",
    mainTooltip: "Inline Code",
    secondaryTooltip: "Ctrl+E",
    icon: CodeLineIcon,
  },

  underline: {
    markName: Underline.name,
    mainTooltip: "Underline",
    secondaryTooltip: "Ctrl+U",
    icon: UnderlineIcon,
  },

  link: {
    markName: "link",
    mainTooltip: "Link",
    secondaryTooltip: "Ctrl+K",
    icon: LinkIcon,
  },

  comment: {
    markName: Comment.name,
    mainTooltip: "Comment",
    secondaryTooltip: "",
    icon: Chat2LineIcon,
  },
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
      return (
        <BubbleMenu className={styles.hidden} editor={this.props.editor} />
      );
    } else {
      return (
        <BubbleMenu className={styles.bubbleMenu} editor={this.props.editor}>
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() => this.props.editor.chain().focus().toggleBold().run()}
            styleDetails={buttonDetails.bold}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() =>
              this.props.editor.chain().focus().toggleItalic().run()
            }
            styleDetails={buttonDetails.italic}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() =>
              this.props.editor.chain().focus().toggleStrike().run()
            }
            styleDetails={buttonDetails.strike}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() => this.props.editor.chain().focus().toggleCode().run()}
            styleDetails={buttonDetails.code}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() =>
              this.props.editor.chain().focus().toggleUnderline().run()
            }
            styleDetails={buttonDetails.underline}
          />
          <LinkBubbleMenuButton
            editor={this.props.editor}
            styleDetails={buttonDetails.link}
          />
          <BubbleMenuButton
            editor={this.props.editor}
            onClick={() => {
              const comment = this.props.commentStore.createComment();
              this.props.editor.chain().focus().setComment(comment.id).run();
            }}
            styleDetails={buttonDetails.comment}
          />
        </BubbleMenu>
      );
    }
  }
}

export default InlineMenu;
