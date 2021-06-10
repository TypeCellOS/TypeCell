import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "prosemirror-state";
import React from "react";
import BoldIcon from "remixicon-react/BoldIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import CodeLineIcon from "remixicon-react/CodeLineIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";

import { Underline } from "../extensions/marks/Underline";
import { Comment } from "../extensions/marks/Comment";
import BubbleMenuButton, { ButtonStyleDetails } from "./BubbleMenuButton";
import styles from "./InlineMenu.module.css";
import Chat2LineIcon from "remixicon-react/Chat2LineIcon";
import { Mark } from "@tiptap/core";
import Bold from "@tiptap/extension-bold";
import {
  CommentStorage,
  CommentType,
} from "../extensions/comments/CommentStorage";
import { sessionStore } from "../../../store/local/stores";

type InlineMenuProps = { editor: Editor };

const commentStorage = new CommentStorage();
const session = sessionStore;

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

const comment: ButtonStyleDetails = {
  markName: Comment.name,
  mainTooltip: "Comment",
  secondaryTooltip: "",
  icon: Chat2LineIcon,
};

class InlineMenu extends React.Component<InlineMenuProps> {
  render() {
    const TOP_DEPTH = 1;

    const resolvedPos = this.props.editor.state.doc.resolve(
      this.props.editor.state.selection.from
    );

    if (resolvedPos.depth > TOP_DEPTH) {
      const grandParent = resolvedPos.node(resolvedPos.depth - 1);
      // console.log(`the grandpa.type.name is ${grandParent.type.name}`);
      if (
        grandParent &&
        grandParent.type.name.toLowerCase().startsWith("table")
      ) {
        return (
          <BubbleMenu className={styles.hidden} editor={this.props.editor} />
        );
      }
    }

    // Renders an empty menu if a block is selected.
    if (this.props.editor.state.selection instanceof NodeSelection) {
      return (
        <BubbleMenu className={styles.hidden} editor={this.props.editor} />
      );
    }

    return (
      <BubbleMenu className={styles.bubbleMenu} editor={this.props.editor}>
        <BubbleMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleBold().run()}
          styleDetails={bold}
        />
        <BubbleMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleItalic().run()}
          styleDetails={italic}
        />
        <BubbleMenuButton
          editor={this.props.editor}
          onClick={() => this.props.editor.chain().focus().toggleStrike().run()}
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
        <BubbleMenuButton
          editor={this.props.editor}
          onClick={() => {
            // Gets unique ID.
            const id: number = commentStorage.getId();

            // Gets comments from browser cache.
            const comments: Array<CommentType> = commentStorage.getComments();

            // Adds new editable comment.
            comments.push({
              id: id,
              editable: true,
              comment: "",
              user: session.loggedInUser!,
              date: new Date().toLocaleDateString("en-US"),
            });

            // Adds highlighting to text.
            this.props.editor.chain().focus().setComment(id).run();

            // Saves updated comments to browser cache.
            commentStorage.setComments(comments);
          }}
          styleDetails={comment}
        />
      </BubbleMenu>
    );
  }
}

export default InlineMenu;
