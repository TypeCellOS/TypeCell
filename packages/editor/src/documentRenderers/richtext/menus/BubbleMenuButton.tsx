import { Editor } from "@tiptap/react";
import Tippy from "@tippyjs/react";
import Button from "@atlaskit/button";
import { RemixiconReactIconComponentType } from "remixicon-react";

import styles from "./BubbleMenuButton.module.css";

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
 * Generate and style the button tooltip based on the given [styleDetails]
 */
export const tooltipContent = (styleDetails: ButtonStyleDetails) => (
  <div className={styles.buttonTooltip}>
    <div className={styles.mainText}>{styleDetails.mainTooltip}</div>
    <div className={styles.secondaryText}>{styleDetails.secondaryTooltip}</div>
  </div>
);

export const isButtonSelected = (editor?: Editor, markName?: string) => {
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
export const addSelectedStyling = (
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
        iconBefore={addSelectedStyling(ButtonIcon, isSelected)}
      />
    </Tippy>
  );
};
