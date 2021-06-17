import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "prosemirror-state";
import React from "react";
import BoldIcon from "remixicon-react/BoldIcon";
import Chat2LineIcon from "remixicon-react/Chat2LineIcon";
import CodeLineIcon from "remixicon-react/CodeLineIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";
import { CommentStore } from "../extensions/comments/CommentStore";
import { Comment } from "../extensions/marks/Comment";
import { Underline } from "../extensions/marks/Underline";
import BubbleMenuButton, { ButtonStyleDetails } from "./BubbleMenuButton";
import styles from "./InlineMenu.module.css";

type InlineMenuProps = { editor: Editor; commentStore: CommentStore };

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

const InlineMenu = (props: InlineMenuProps) => {
  const TOP_DEPTH = 1;

  const resolvedPos = props.editor.state.doc.resolve(
    props.editor.state.selection.from
  );

  if (resolvedPos.depth > TOP_DEPTH) {
    const grandParent = resolvedPos.node(resolvedPos.depth - 1);
    // console.log(`the grandpa.type.name is ${grandParent.type.name}`);
    if (
      grandParent &&
      grandParent.type.name.toLowerCase().startsWith("table")
    ) {
      return <BubbleMenu className={styles.hidden} editor={props.editor} />;
    }
  }

  // Renders an empty menu if a block is selected.
  if (props.editor.state.selection instanceof NodeSelection) {
    return <BubbleMenu className={styles.hidden} editor={props.editor} />;
  }

  return (
    <BubbleMenu className={styles.bubbleMenu} editor={props.editor}>
      <BubbleMenuButton
        editor={props.editor}
        onClick={() => props.editor.chain().focus().toggleBold().run()}
        styleDetails={bold}
      />
      <BubbleMenuButton
        editor={props.editor}
        onClick={() => props.editor.chain().focus().toggleItalic().run()}
        styleDetails={italic}
      />
      <BubbleMenuButton
        editor={props.editor}
        onClick={() => props.editor.chain().focus().toggleStrike().run()}
        styleDetails={strike}
      />
      <BubbleMenuButton
        editor={props.editor}
        onClick={() => props.editor.chain().focus().toggleCode().run()}
        styleDetails={code}
      />
      <BubbleMenuButton
        editor={props.editor}
        onClick={() => props.editor.chain().focus().toggleUnderline().run()}
        styleDetails={underline}
      />
      <BubbleMenuButton
        editor={props.editor}
        onClick={() => {
          const comment = props.commentStore.createComment();
          props.editor.chain().focus().setComment(comment.id).run();
        }}
        styleDetails={comment}
      />
    </BubbleMenu>
  );
};

export default InlineMenu;
