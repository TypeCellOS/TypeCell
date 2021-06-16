import { Editor } from "@tiptap/react";
import React, { useEffect, useState } from "react";
import {
  Container,
  ContainerWrapper,
  IconWrapper,
  UrlInputWrapper,
} from "../extensions/marks/AtlaskitHyperlink/ToolbarComponent";
import Tooltip from "@atlaskit/tooltip";
import LinkIcon from "remixicon-react/LinkIcon";
import PanelTextInput from "../extensions/marks/AtlaskitHyperlink/PanelTextInput";
import { EDITING_MENU_LINK } from "../extensions/marks/Hyperlink";

export type LinkFormProps = { editor: Editor };

const LinkForm: React.FC<LinkFormProps> = (props: LinkFormProps) => {
  /**
   * The input form is a controlled component and uses the url state.
   *
   * The "value" attribute of the input form is set to this state,
   * and it gets updated throughout the functions in this file.
   */
  const [url, setUrl] = useState("");

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
   * Handles form submit
   *
   * Called when the submit button is clicked. Will remove the link mark
   * if the url state is empty, and set a link if its not. The url that will
   * be set is prepended with "//" to force the browser open it as an absolute
   * path.
   */
  const handleSubmit = (e: any) => {
    const absoluteUrl = "//" + url;

    if (url === "") {
      props.editor.chain().focus().unsetLink().run();
    } else {
      props.editor.chain().focus().setLink({ href: absoluteUrl }).run();
      setUrl("");
    }
  };

  /**
   * Updates the url state
   */
  const handleChange = (val: string) => {
    setUrl(val);
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
            onChange={handleChange}
            onSubmit={handleSubmit}></PanelTextInput>
        </UrlInputWrapper>
      </Container>
    </ContainerWrapper>
  );
};

export default LinkForm;
