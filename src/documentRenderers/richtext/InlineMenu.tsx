import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "prosemirror-state";
import React, { FunctionComponent, useEffect } from "react";
import styles from "./InlineMenu.module.css";
import Tippy from "@tippyjs/react";
import LinkForm from "./LinkForm";
import { Underline } from "./extensions/marks/Underline";
import Button from "@atlaskit/button";

import { RemixiconReactIconComponentType } from "remixicon-react";
import BoldIcon from "remixicon-react/BoldIcon";
import ItalicIcon from "remixicon-react/ItalicIcon";
import StrikethroughIcon from "remixicon-react/StrikethroughIcon";
import CodeLineIcon from "remixicon-react/CodeLineIcon";
import UnderlineIcon from "remixicon-react/UnderlineIcon";
import LinkIcon from "remixicon-react/LinkIcon";

import tableStyles from "./extensions/blocktypes/Table.module.css";

type InlineMenuProps = { editor: Editor };
type MenuButtonProps = {
  editor: Editor;
  styleDetails: StyleDetails;
  onClick: () => void;
};
type LinkMenuButtonProps = {
  editor: Editor;
  styleDetails: StyleDetails;
};

/**
 * [name] has to be the same as the name in the defining Mark (see underline below)
 */
type StyleDetails = {
  name: string;
  mainTooltip: string;
  secondaryTooltip: string;
  icon: RemixiconReactIconComponentType;
  // icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
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

const link: StyleDetails = {
  name: "link",
  mainTooltip: "Link",
  secondaryTooltip: "Ctrl+K",
  icon: LinkIcon,
};

/**
 * The tooltip component that is rendered for the tippy content prop
 */
class ToolTip extends React.Component<StyleDetails> {
  render() {
    return (
      <div className={styles.buttonTooltip}>
        <div className={styles.mainText}>{this.props.mainTooltip}</div>
        <div className={styles.secondaryText}>
          {this.props.secondaryTooltip}
        </div>
      </div>
    );
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
    let isButtonSelected = () => this.props.editor.isActive(name);
    const ButtonIcon = this.props.styleDetails.icon;

    return (
      <Tippy content={<ToolTip {...this.props.styleDetails} />}>
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

/**
 * The link button that shows in the inline menu
 *
 * The link button has an additional menu when clicked on,
 * which is why it is needed to be rendered differently from the other
 * menu buttons. The clicking even is handled by the inner Tippy tag.
 */
class LinkInlineMenuButton extends React.Component<LinkMenuButtonProps> {
  render() {
    const name = this.props.styleDetails.name;
    let isButtonSelected = () => this.props.editor.isActive(name);
    const ButtonIcon = this.props.styleDetails.icon;
    return (
      <Tippy
        content={<ToolTip {...this.props.styleDetails} />}
        theme="material">
        <Tippy
          content={<LinkForm editor={this.props.editor} />}
          trigger={"click"}
          interactive={true}
          maxWidth={500}>
          <Button
            appearance="subtle"
            // onClick={this.props.onClick}
            // isSelected={isButtonSelected()}
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
      </Tippy>
    );
  }
}

/**
 * The bubble menu which renders InlineMenuButtons and a LinkInlineMenu
 */
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
      <BubbleMenu className={styles.inlineMenu} editor={this.props.editor}>
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
          onClick={() =>
            this.props.editor.chain().focus().toggleUnderline().run()
          }
          styleDetails={underline}
        />
        <LinkInlineMenuButton editor={this.props.editor} styleDetails={link} />
      </BubbleMenu>
    );
  }
}

export default InlineMenu;
