import { Editor } from "@tiptap/react";
import Tippy from "@tippyjs/react";
import Button from "@atlaskit/button";
import { RemixiconReactIconComponentType } from "remixicon-react";
import { HyperlinkEditMenu } from "../extensions/marks/hyperlinkMenus/HyperlinkEditMenu";

import styles from "./BubbleMenuButton.module.css";
import { useCallback, useState } from "react";

/**
 * The details that determine how a button and its tooltip look
 *
 * [markName] has to be the same as the name in the defining Mark (see underline in InlineMenu).
 */
export type ButtonStyleDetails = {
  icon: RemixiconReactIconComponentType;
  mainTooltip: string;
  secondaryTooltip?: string;
  markName?: string;
};

/**
 * The props used by a menu button
 *
 * [editor] is an optional parameter because it's used for the InlineMenu, but not for the TableInlineMenu.
 */
export type MenuButtonProps = {
  styleDetails: ButtonStyleDetails;
  onClick: () => void;
  editor?: Editor;
};

/**
 * The link menu button is different since it opens a tooltip on click (instead of directly styling the selected text)
 */
export type LinkMenuButtonProps = {
  styleDetails: ButtonStyleDetails;
  editor: Editor;
};

/**
 * Generate and style the button tooltip based on the given [styleDetails]
 */
const tooltipContent = (styleDetails: ButtonStyleDetails) => (
  <div className={styles.buttonTooltip}>
    <div className={styles.mainText}>{styleDetails.mainTooltip}</div>
    <div className={styles.secondaryText}>{styleDetails.secondaryTooltip}</div>
  </div>
);

const isButtonSelected = (editor?: Editor, markName?: string) => {
  if (editor && markName) {
    if (markName === "comment") {
      // Always false as it should be possible to add overlapping comments.
      return false;
    }
    return editor.isActive(markName);
  } else return false;
};

/**
 * Sets the css class for the icon, so that if selected, it looks different
 */
const iconWithClass = (
  ButtonIcon: RemixiconReactIconComponentType,
  isSelected: boolean
) => (
  <ButtonIcon
    className={styles.icon + " " + (isSelected ? styles.isSelected : "")}
  />
);

/**
 * The button that shows in the inline menu.
 *
 * __When adding new buttons__ create a constant with the details.
 */
export const BubbleMenuButton = (props: MenuButtonProps) => {
  const markName = props.styleDetails.markName;
  const isSelected = isButtonSelected(props.editor, markName);

  // To be used in DOM, it needs to be with capital letter
  const ButtonIcon = props.styleDetails.icon;

  return (
    <Tippy content={tooltipContent(props.styleDetails)}>
      <Button
        appearance="subtle"
        onClick={props.onClick}
        isSelected={isSelected}
        iconBefore={iconWithClass(ButtonIcon, isSelected)}
      />
    </Tippy>
  );
};

/**
 * The link menu button is different since it opens a tooltip on click (instead of directly styling the selected text)
 */
export const LinkBubbleMenuButton = (props: LinkMenuButtonProps) => {
  const markName = props.styleDetails.markName;
  const isSelected = isButtonSelected(props.editor, markName);

  // To be used in DOM, it needs to be with capital letter
  const ButtonIcon = props.styleDetails.icon;

  const [creationMenu, setCreationMenu] = useState<any>();

  const updateCreationMenu = useCallback(() => {
    const onSubmit = (url: string, text: string) => {
      if (url === "") {
        return;
      }
      const mark = props.editor.schema.mark("link", { href: url });
      let { from, to } = props.editor.state.selection;
      props.editor.view.dispatch(
        props.editor.view.state.tr
          .insertText(text, from, to)
          .addMark(from, from + text.length, mark)
      );
    };

    // get the currently selected text and url from the document, and use it to
    // create a new creation menu
    const { from, to } = props.editor.state.selection;
    const selectedText = props.editor.state.doc.textBetween(from, to);
    const activeUrl = props.editor.isActive("link")
      ? props.editor.getAttributes("link").href || ""
      : "";

    setCreationMenu(
      <HyperlinkEditMenu
        key={Math.random() + ""} // Math.random to prevent old element from being re-used
        url={activeUrl}
        text={selectedText}
        onSubmit={onSubmit}
      />
    );
  }, [props.editor]);

  return (
    <Tippy content={tooltipContent}>
      <Tippy
        content={creationMenu}
        trigger={"click"}
        onShow={(_) => {
          updateCreationMenu();
        }}
        interactive={true}
        maxWidth={500}>
        <Button
          appearance="subtle"
          isSelected={isSelected}
          iconBefore={iconWithClass(ButtonIcon, isSelected)}
        />
      </Tippy>
    </Tippy>
  );
};
