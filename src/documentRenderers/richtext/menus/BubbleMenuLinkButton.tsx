import Button from "@atlaskit/button";
import Tippy from "@tippyjs/react";
import { Editor } from "@tiptap/react";
import React, { useCallback, useState } from "react";
import { HyperlinkEditMenu } from "../extensions/marks/hyperlinkMenus/HyperlinkEditMenu";
import { ButtonStyleDetails } from "./BubbleMenuButton";
import styles from "./InlineMenu.module.css";

export type LinkMenuButtonProps = {
  styleDetails: ButtonStyleDetails & { markName: string };
  editor: Editor;
};

/**
 * The button that shows in the inline menu.
 *
 * __When adding new buttons__ create a constant with the details.
 */
const BubbleMenuLinkButton = (props: LinkMenuButtonProps) => {
  const [creationMenu, setCreationMenu] = useState<any>();

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
    return props.editor.isActive(markName);
  };

  const ButtonIcon = props.styleDetails.icon;

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

  const updateCreationMenu = useCallback(() => {
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
  }, [props.editor, props.editor.state]);

  return (
    <Tippy content={tooltipContent}>
      <Tippy
        content={creationMenu}
        trigger={"click"}
        onShow={(instance) => {
          updateCreationMenu();
        }}
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
