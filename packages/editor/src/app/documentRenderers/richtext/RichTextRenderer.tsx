import { observer } from "mobx-react-lite";
import React from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import ReactDOM from "react-dom";
import { DocumentResource } from "../../../store/DocumentResource";
import { getStoreService } from "../../../store/local/stores";
import styles from "./RichTextRenderer.module.css";

type Props = {
  document: DocumentResource;
};
window.React = React;
window.ReactDOM = ReactDOM;

const RichTextRenderer: React.FC<Props> = observer((props) => {
  const sessionStore = getStoreService().sessionStore;

  const editor = useBlockNote({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: styles.editor,
        "data-test": "editor",
      },
    },
    disableHistoryExtension: true,
    extensions: [
      CollaborationCursor.configure({
        provider: props.document.webrtcProvider,
        user: {
          name: sessionStore.loggedInUserId || "Anonymous",
          color: sessionStore.userColor,
        },
      }),
      Collaboration.configure({
        fragment: props.document.data,
      }),
    ],
  });
  return <BlockNoteView editor={editor} />;
});

export default RichTextRenderer;
