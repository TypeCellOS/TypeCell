import { observer } from "mobx-react-lite";
import * as React from "react";
import { BaseResource } from "../store/BaseResource";

import styles from "./CreateDocumentView.module.css";

type Props = {
  document: BaseResource;
};

const CreateDocumentView = observer((props: Props) => {
  function createNotebook() {
    props.document.create("!notebook");
  }

  function createPlugin() {
    props.document.create("!plugin");
  }

  return (
    <div className={styles.container}>
      <button onClick={createNotebook}>Create new document</button>
      <button onClick={createPlugin}>Create new plugin</button>
    </div>
  );
});

export default CreateDocumentView;
