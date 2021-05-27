import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "prosemirror-state";
import React, { FunctionComponent, useEffect } from "react";
import Tippy from "@tippyjs/react";
import { Underline } from "../extensions/marks/Underline";
import Button from "@atlaskit/button";

import styles from "./InlineMenu.module.css";
import { RemixiconReactIconComponentType } from "remixicon-react";
import BoldIcon from "remixicon-react/BoldIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import CodeLineIcon from "remixicon-react/CodeLineIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";

type InlineMenuProps = { editor: Editor };
type MenuButtonProps = {
  styleDetails: StyleDetails;
  onClick: () => void;
  editor?: Editor;
};

/**
 * [name] has to be the same as the name in the defining Mark (see underline below)
 */
type StyleDetails = {
  name: string;
  mainTooltip: string;
  secondaryTooltip: string;
  icon: RemixiconReactIconComponentType;
};

const bold: StyleDetails = {
  name: "bold",
  mainTooltip: "Bold",
  // This will change to a variable if custom shortcuts are implemented
  secondaryTooltip: "Ctrl+B",
  icon: BoldIcon,
};

const italic: StyleDetails = {
  name: "italic",
  mainTooltip: "Italic",
  secondaryTooltip: "Ctrl+I",
  icon: ItalicIcon,
};

const strike: StyleDetails = {
  name: "strike",
  mainTooltip: "Strikethrough",
  secondaryTooltip: "Ctrl+Shift+X",
  icon: StrikethroughIcon,
};

const code: StyleDetails = {
  name: "code",
  mainTooltip: "Inline Code",
  secondaryTooltip: "Ctrl+E",
  icon: CodeLineIcon,
};

const underline: StyleDetails = {
  name: Underline.name,
  mainTooltip: "Underline",
  secondaryTooltip: "Ctrl+U",
  icon: UnderlineIcon,
};

/**
 * The button that shows in the inline menu.
 *
 * __When adding new marks(menu items)__
 * - add the mark name to the constants above
 * - and provide tooltip text
 */
class BubbleMenuButton extends React.Component<MenuButtonProps> {
  render() {
    const tooltipContent = (
      <div className={styles.buttonTooltip}>
        <div className={styles.mainText}>
          {this.props.styleDetails.mainTooltip}
        </div>
        <div className={styles.secondaryText}>
          {this.props.styleDetails.secondaryTooltip}
        </div>
      </div>
    );

    let isButtonSelected = () => {
      if (this.props.editor) {
        return this.props.editor.isActive(this.props.styleDetails.name);
      } else return false;
    };

    // To be used in DOM, it needs to be with capital letter
    const ButtonIcon = this.props.styleDetails.icon;

    return (
      <Tippy content={tooltipContent}>
        <Button
          appearance="subtle"
          onClick={this.props.onClick}
          isSelected={isButtonSelected()}
          iconBefore={
            ButtonIcon ? (
              <ButtonIcon
                className={
                  styles.icon +
                  " " +
                  (isButtonSelected() ? styles.isSelected : "")
                }
              />
            ) : undefined
          }
        />
      </Tippy>
    );
  }
}

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
      </BubbleMenu>
    );
  }
}

export { InlineMenu, BubbleMenuButton };
