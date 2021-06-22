import { Editor } from "@tiptap/core";
import React from "react";
import Tippy from "@tippyjs/react";
import Button from "@atlaskit/button";
import { RemixiconReactIconComponentType } from "remixicon-react";

import styles from "./InlineMenu.module.css";

/**
 * [markName] has to be the same as the name in the defining Mark (see underline in InlineMenu)
 */
export type ButtonStyleDetails = {
  icon: RemixiconReactIconComponentType;
  mainTooltip: string;
  secondaryTooltip?: string;
  markName?: string;
};

export type MenuButtonProps = {
  styleDetails: ButtonStyleDetails;
  onClick: () => void;
  editor?: Editor;
};

/**
 * The button that shows in the inline menu.
 *
 * __When adding new buttons__ create a constant with the details.
 */
const BubbleMenuButton = (props: MenuButtonProps) => {
  const tooltipContent = (
    <div className={styles.buttonTooltip}>
      <div className={styles.mainText}>{props.styleDetails.mainTooltip}</div>
      <div className={styles.secondaryText}>
        {props.styleDetails.secondaryTooltip}
      </div>
    </div>
  );

  const markName = props.styleDetails.markName;
  let isButtonSelected = () => {
    if (props.editor && markName) {
      if (markName === "comment") {
        // Always false as it should be possible to add overlapping comments.
        return false;
      }
      return props.editor.isActive(markName);
    } else return false;
  };

  // To be used in DOM, it needs to be with capital letter
  const ButtonIcon = props.styleDetails.icon;

  return (
    <Tippy content={tooltipContent}>
      <Button
        appearance="subtle"
        onClick={props.onClick}
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
};

export default BubbleMenuButton;
