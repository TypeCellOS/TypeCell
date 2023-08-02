import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import "@blocknote/core/style.css";
import { WebsocketProvider } from "y-websocket";
import { DocumentResource } from "../../../store/DocumentResource";
import { SessionStore } from "../../../store/local/SessionStore";
import { FrameHost } from "./FrameHost";
type Props = {
  document: DocumentResource;
  sessionStore: SessionStore;
};

const RichTextRenderer: React.FC<Props> = observer((props) => {
  useEffect(() => {
    const provider = new WebsocketProvider(
      "",
      "demotest", // TODO: pass along
      props.document.ydoc,
      {
        connect: false,
        awareness: props.document.awareness,
      }
    );
    // provider.awareness.on("update", () => {
    //   console.log("update2");
    // });
    provider.connectBc();
    return () => {
      provider.disconnectBc();
      provider.destroy();
    };
  });

  return (
    <FrameHost
      documentId={props.document.id}
      sessionStore={props.sessionStore}
    />
  );
});

export default RichTextRenderer;
