/// <reference types="@emotion/react/types/css-prop" />
// import * as React from "react";
import Flag from "@atlaskit/flag";
import { VscWarning } from "react-icons/vsc";

/**
 * A popup that is shown when we haven't received a "pong" message for a while.
 * There might be an infinite loop or other error in the user code.
 */
export const FreezeAlert = (props: {
  // onDismiss: () => void;
  onReload: () => void;
}) => {
  return (
    <Flag
      css={{
        zIndex: 2000,
        backgroundColor: "rgb(222, 53, 11)",
      }}
      appearance="error"
      icon={
        <VscWarning
          css={{
            width: "24px",
            height: "24px",
            padding: "2px",
          }}
        />
      }
      id="error"
      key="error"
      title="The document is not responding"
      description="It seems like your document has frozen. Perhaps there is an infinite loop in the code?
      Fix any code errors and click Reload to retry."
      actions={[
        // { content: "Dismiss", onClick: props.onDismiss },
        { content: "Reload", onClick: props.onReload },
      ]}
    />
  );
};
