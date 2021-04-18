import { observer } from "mobx-react-lite";
import * as React from "react";
import TCDocument from "../store/LoadingTCDocument";
import styles from "./CreateDocumentView.module.css";

type Props = {
  document: TCDocument;
};

const CreateDocumentView = observer((props: Props) => {
  function click() {
    props.document.create("!notebook");
  }

  return (
    <div className={styles.container}>
      <button onClick={click}>Create new document</button>
    </div>
  );
});

export default CreateDocumentView;
