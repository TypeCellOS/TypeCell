import React from "react";
import Tippy from "@tippyjs/react";
import Button from "@atlaskit/button";
import { RemixiconReactIconComponentType } from "remixicon-react";
import LinkForm from "./LinkForm";

import styles from "./InlineMenu.module.css";
import LinkIcon from "remixicon-react/LinkIcon";
import { ButtonStyleDetails } from "./BubbleMenuButton";
import { Editor } from "@tiptap/react";

export type LinkMenuButtonProps = {
  styleDetails: ButtonStyleDetails;
  editor: Editor;
};

/**
 * The button that shows in the inline menu.
 *
 * __When adding new buttons__ create a constant with the details.
 */
const BubbleMenuLinkButton = (props: LinkMenuButtonProps) => {
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
      return props.editor.isActive(markName);
    } else return false;
  };

  // To be used in DOM, it needs to be with capital letter
  const ButtonIcon = props.styleDetails.icon;

  return (
    <Tippy content={tooltipContent}>
      <Tippy
        data-cy={"bubble-menu-button"}
        content={<LinkForm editor={props.editor} />}
        trigger={"click"}
        interactive={true}
        maxWidth={500}>
        <Button
          appearance="subtle"
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
    </Tippy>
  );
};

export default BubbleMenuLinkButton;
