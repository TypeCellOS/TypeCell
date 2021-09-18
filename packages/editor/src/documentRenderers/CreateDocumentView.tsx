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

  function createRichText() {
    props.resource.create("!richtext");
  }

  function createCustom(resourceType: ResourceType) {
    // TODO: add a plugin Ref to the document, and add support for DocumentPlugins
    props.resource.create(resourceType.id);
  }

  return (
    <div className={styles.container}>
      <button onClick={createNotebook}>Create new notebook</button>
      <button onClick={createPlugin}>Create new plugin</button>
      <button onClick={createRichText}>Create new rich text editor</button>
      {values(runtimeStore.resourceTypes).map((type) => (
        <button key={type.name} onClick={() => createCustom(type)}>
          Create new {type.name}
        </button>
      ))}
    </div>
  );
});

export default CreateDocumentView;
