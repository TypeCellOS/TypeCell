import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo } from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import "@blocknote/core/style.css";

import { uniqueId } from "@typecell-org/util";
import * as awarenessProtocol from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";
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

  useEffect(() => {
    const provider = new WebsocketProvider("", roomName, props.document.ydoc, {
      connect: false,
      awareness: props.document.awareness,
    });
    const frameClientIds = new Set<number>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props.document.awareness?.on("change", (changes: any, origin: any) => {
      if (origin !== provider) {
        return;
      }
      if (changes.added.length === 0) {
        return;
      }
      changes.added.forEach((client: number) => {
        frameClientIds.add(client);
      });
    });
    provider.connectBc();

    const removePresence = () => {
      // remove cursor from awareness when we navigate away
      if (props.document.awareness) {
        awarenessProtocol.removeAwarenessStates(
          props.document.awareness,
          [...frameClientIds],
          "window unload",
        );
      }
    };

    window.addEventListener("beforeunload", removePresence);

    return () => {
      window.removeEventListener("beforeunload", removePresence);
      removePresence();
      provider.disconnectBc();
      provider.destroy();
    };
  }, [props.document, roomName]);

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

  return <FrameHost url={src} sessionStore={props.sessionStore} />;
});

export default RichTextRenderer;
