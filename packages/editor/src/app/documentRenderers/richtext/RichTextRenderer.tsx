import { observer } from "mobx-react-lite";
import React from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import ReactDOM from "react-dom";
import { DocumentResource } from "../../../store/DocumentResource";
import { SessionStore } from "../../../store/local/SessionStore";
import styles from "./RichTextRenderer.module.css";

type Props = {
  document: DocumentResource;
  sessionStore: SessionStore;
};
window.React = React;
window.ReactDOM = ReactDOM;

class FakeProvider {
  constructor(public readonly awareness: any) {}
}

const RichTextRenderer: React.FC<Props> = observer((props) => {
  const { sessionStore } = props;

  const editor = useBlockNote({
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    collaboration: {
      provider: new FakeProvider(props.document.awareness),
      user: {
        name: sessionStore.loggedInUserId || "Anonymous",
        color: sessionStore.userColor,
      },
      fragment: props.document.data as any,
    },
  });
  return <BlockNoteView editor={editor} />;
});

export default RichTextRenderer;
