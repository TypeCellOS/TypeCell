import { values } from "mobx";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { BaseResource } from "../store/BaseResource";
import { ResourceType, runtimeStore } from "../store/local/runtimeStore";
import styles from "./CreateDocumentView.module.css";

type Props = {
  resource: BaseResource;
};

const CreateDocumentView = observer((props: Props) => {
  function createNotebook() {
    props.resource.create("!notebook");
  }

  function createPlugin() {
    props.resource.create("!plugin");
  }

  function createCustom(resourceType: ResourceType) {
    props.resource.create(resourceType.id);
  }

  return (
    <div className={styles.container}>
      <button onClick={createNotebook}>Create new document</button>
      <button onClick={createPlugin}>Create new plugin</button>
      {values(runtimeStore.resourceTypes).map((type) => (
        <button key={type.name} onClick={() => createCustom(type)}>
          Create new {type.name}
        </button>
      ))}
    </div>
  );
});

export default CreateDocumentView;
