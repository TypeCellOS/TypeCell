import { EDITING_MENU } from "../Hyperlink";
import {
  Container,
  ContainerWrapper,
  IconWrapper,
  TextInputWrapper,
  UrlInputWrapper,
} from "../AtlaskitHyperlink/ToolbarComponent";
import PanelTextInput from "../AtlaskitHyperlink/PanelTextInput";
import Tooltip from "@atlaskit/tooltip";
import LinkIcon from "remixicon-react/LinkIcon";
import TextIcon from "remixicon-react/TextIcon";
import React from "react";

type HyperlinkEditorMenuProps = {
  anchor: HTMLAnchorElement;
  editHandler: (href: string, text: string) => void;
};

/**
 * The sub menu for editing an anchor element
 * @param props props of menu for editing
 * @returns a menu for the edit operation of a hyperlink
 */
export const HyperlinkEditMenu = (props: HyperlinkEditorMenuProps) => {
  const [href, setHref] = React.useState(
    props.anchor.getAttribute("href")?.substring(2)
  );
  const [text, setText] = React.useState(props.anchor.innerText);

  return (
    <ContainerWrapper>
      <Container provider={false} id={EDITING_MENU}>
        <UrlInputWrapper>
          <IconWrapper>
            <Tooltip content={"Edit the link"}>
              <LinkIcon></LinkIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            defaultValue={href!}
            autoFocus={true}
            onSubmit={(linkValue) => {
              props.editHandler("//" + linkValue, text);
            }}
            onChange={(value) => {
              setHref(value);
            }}></PanelTextInput>
        </UrlInputWrapper>
        <TextInputWrapper>
          <IconWrapper>
            <Tooltip content={"Edit the title"}>
              <TextIcon></TextIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            defaultValue={text!}
            onSubmit={(textValue) => {
              props.editHandler("//" + href, textValue);
            }}
            onChange={(value) => {
              setText(value);
            }}></PanelTextInput>
        </TextInputWrapper>
      </Container>
    </ContainerWrapper>
  );
};
