import { Editor } from "@tiptap/react";
import React, { useEffect, useState } from "react";
import {
  Container,
  ContainerWrapper,
  IconWrapper,
  TextInputWrapper,
  UrlInputWrapper,
} from "../extensions/marks/AtlaskitHyperlink/ToolbarComponent";
import Tooltip from "@atlaskit/tooltip";
import LinkIcon from "remixicon-react/LinkIcon";
import PanelTextInput from "../extensions/marks/AtlaskitHyperlink/PanelTextInput";
import { EDITING_MENU_LINK } from "../extensions/marks/Hyperlink";
import TextIcon from "remixicon-react/TextIcon";

export type LinkFormProps = { editor: Editor };

const LinkForm: React.FC<LinkFormProps> = (props: LinkFormProps) => {
  /**
   * The input form is a controlled component and uses the url and text states.
   *
   * they get updated throughout the functions in this file.
   */
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  /**
   * Updates the url state in the background(when link menu is out of focus)
   *
   * If the selection has an active link mark, removes the first two characters:
   * "//", and updates url state. Gets called when the url state changes
   */
  useEffect(() => {
    if (props.editor.isFocused) {
      if (props.editor.isActive("link")) {
        setUrl(props.editor.getAttributes("link").href.substring(2));
      } else {
        setUrl("");
      }
    }
  });

  /**
   * Updates the text state in the backgroud
   *
   * The text comes from the selection extracted from doc
   */
  useEffect(() => {
    if (props.editor.isFocused) {
      const { from, to } = props.editor.state.selection;
      const selectedText = props.editor.state.doc.textBetween(from, to);
      setText(selectedText);
    }
  });

  /**
   * Handles form submit
   *
   * Called when the key Enter is pressed. No mark is set if the url is empty
   * and a proper hyperlink will be set if it's not. The url that will be set
   * is prepended with "//" to force the browser open it as an absolute path
   */
  const submission = () => {
    if (url === "") {
      return;
    }
    const absoluteUrl = "//" + url;
    const mark = props.editor.schema.mark("link", { href: absoluteUrl });
    let { from, to } = props.editor.state.selection;
    props.editor.view.dispatch(
      props.editor.view.state.tr
        .insertText(text, from, to)
        .addMark(from, from + text.length, mark)
    );
  };

  return (
    <ContainerWrapper>
      <Container provider={false}>
        <UrlInputWrapper>
          <IconWrapper>
            <Tooltip content={"Add a hyperlink"}>
              <LinkIcon></LinkIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            id={EDITING_MENU_LINK}
            placeholder={"URL"}
            defaultValue={url}
            onChange={(value) => setUrl(value)}
            onSubmit={submission}></PanelTextInput>
        </UrlInputWrapper>
        <TextInputWrapper>
          <IconWrapper>
            <Tooltip content={"Edit the title"}>
              <TextIcon></TextIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            defaultValue={text!}
            onSubmit={submission}
            onChange={(value) => setText(value)}></PanelTextInput>
        </TextInputWrapper>
      </Container>
    </ContainerWrapper>
  );
};

export default LinkForm;
