import Button from "@atlaskit/button";
import Tippy from "@tippyjs/react";
import { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";
import { HyperlinkEditMenu } from "../extensions/marks/hyperlinkMenus/HyperlinkEditMenu";
import {
  ButtonStyleDetails,
  addSelectedStyling,
  isButtonSelected,
  tooltipContent,
} from "./BubbleMenuButton";

/**
 * The link menu button is different since it opens a tooltip on click (instead of directly styling the selected text)
 */
export type LinkMenuButtonProps = {
  styleDetails: ButtonStyleDetails;
  editor: Editor;
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
          iconBefore={addSelectedStyling(ButtonIcon, isSelected)}
        />
      </Tippy>
    </Tippy>
  );
};

export default LinkBubbleMenuButton;
