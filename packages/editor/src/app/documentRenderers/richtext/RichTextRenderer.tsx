import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import "@blocknote/core/style.css";

import { uniqueId } from "@typecell-org/util";
import { getFrameDomain } from "../../../config/security";
import { DocumentResource } from "../../../store/DocumentResource";
import { SessionStore } from "../../../store/local/SessionStore";
import { FrameHost } from "./FrameHost";
type Props = {
  document: DocumentResource;
  sessionStore: SessionStore;
};

const RichTextRenderer: React.FC<Props> = observer((props) => {
  const roomName = useMemo(() => {
    return "room-" + uniqueId.generateUuid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.document.id]);

  const params = new URLSearchParams();
  params.append("documentId", props.document.id);
  params.append("roomName", roomName);
  params.append("userColor", props.sessionStore.userColor);
  params.append("userName", props.sessionStore.loggedInUserId || "anonymous");

  if (window.location.search.includes("noRun")) {
    params.append("noRun", "true");
  }

  const src =
    window.location.protocol +
    "//" +
    getFrameDomain() +
    "/?frame" +
    "#" +
    params.toString();

  return (
    <FrameHost
      url={src}
      document={props.document}
      sessionStore={props.sessionStore}
    />
  );
});

export default RichTextRenderer;
