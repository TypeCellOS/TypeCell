import { observer } from "mobx-react-lite";
import React from "react";
// import LocalExecutionHost from "../../../runtime/executor/executionHosts/local/LocalExecutionHost"
import { EditorContent, useEditor } from "@blocknote/core";
import { DocumentResource } from "../../../store/DocumentResource";
import { getStoreService } from "../../../store/local/stores";

type Props = {
  document: DocumentResource;
};

const RichTextRenderer: React.FC<Props> = observer((props) => {
  const sessionStore = getStoreService().sessionStore;
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      console.log(editor.getJSON());
    },
    editorProps: {
      attributes: {
        // class: styles.editor,
        "data-test": "editor",
      },
    },
  });
  return <EditorContent editor={editor} />;
  // renderLogger.log("cellList");
  // return <div className="cellList">hello</div>;
});

export default RichTextRenderer;
