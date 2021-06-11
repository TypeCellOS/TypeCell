import styled, { css } from "styled-components";
import { N80, N30 } from "@atlaskit/theme/colors";

// code taken from https://bitbucket.org/atlassian/design-system-mirror/src/master/editor/editor-core/src/ui/LinkSearch/ToolbarComponents.tsx
// and https://bitbucket.org/atlassian/design-system-mirror/src/master/editor/editor-core/src/plugins/hyperlink/ui/HyperlinkAddToolbar/HyperlinkAddToolbar.tsx

export const RECENT_SEARCH_WIDTH_IN_PX = 420;
export const RECENT_SEARCH_WIDTH_WITHOUT_ITEMS_IN_PX = 360;
export const RECENT_SEARCH_HEIGHT_IN_PX = 360;

export const InputWrapper = `
  display: flex;
  line-height: 0;
  padding: 5px 0;
  align-items: center;
`;

export const UrlInputWrapper = styled.div`
  ${InputWrapper}
  border-bottom: none !important;
`;

export const Container = styled.div`
  width: ${RECENT_SEARCH_WIDTH_IN_PX}px;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 0;

  ${({ provider }: { provider: boolean }) =>
    css`
      width: ${provider
        ? RECENT_SEARCH_WIDTH_IN_PX
        : RECENT_SEARCH_WIDTH_WITHOUT_ITEMS_IN_PX}px;
    `};
  line-height: initial;
`;

export const TextInputWrapper = styled.div`
  ${InputWrapper};
  border-top: 1px solid ${N30};
`;

export const IconWrapper = styled.span`
  color: ${N80};
  padding: 4px 8px;
  width: 36px;
`;

export const ContainerWrapper = styled.div`
  background-color: white;
  border-radius: 3px;
  box-shadow: rgb(9 30 66 / 31%) 0px 0px 1px,
    rgb(9 30 66 / 25%) 0px 4px 8px -2px;
  padding: 4px 8px;
  display: flex;
  line-height: 1;
  box-sizing: border-box;
`;
