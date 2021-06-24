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
import { useState } from "react";

export type HyperlinkEditorMenuProps = {
  url: string;
  text: string;
  onSubmit: (url: string, text: string) => void;
};

/**
 * The sub menu for editing an anchor element
 * @param props props of menu for editing
 * @returns a menu for the edit operation of a hyperlink
 */
export const HyperlinkEditMenu = (props: HyperlinkEditorMenuProps) => {
  const [url, setUrl] = useState(props.url);
  const [text, setText] = useState(props.text);

  return (
    <ContainerWrapper>
      <Container provider={false}>
        <UrlInputWrapper>
          <IconWrapper>
            <Tooltip content={"Edit the link"} position={"left"}>
              <LinkIcon size={20}></LinkIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            defaultValue={url}
            autoFocus={true}
            onSubmit={(value) => {
              props.onSubmit(value, text);
            }}
            onChange={(value) => {
              setUrl(value);
            }}></PanelTextInput>
        </UrlInputWrapper>
        <TextInputWrapper>
          <IconWrapper>
            <Tooltip content={"Edit the title"} position={"left"}>
              <TextIcon size={20}></TextIcon>
            </Tooltip>
          </IconWrapper>
          <PanelTextInput
            defaultValue={text!}
            onSubmit={(value) => {
              props.onSubmit(url, value);
            }}
            onChange={(value) => {
              setText(value);
            }}></PanelTextInput>
        </TextInputWrapper>
      </Container>
    </ContainerWrapper>
  );
};
