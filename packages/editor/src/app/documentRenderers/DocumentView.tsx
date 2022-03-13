import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import { Identifier } from "../../identifiers/Identifier";
import { DocConnection } from "../../store/DocConnection";
import PluginResource from "../../store/PluginResource";
import ProjectResource from "../../store/ProjectResource";
import DocumentMenu from "../main/components/documentMenu";
// import { CustomRenderer } from "./custom/CustomRenderer";
import NotebookRenderer from "./notebook/NotebookRenderer";
import PluginRenderer from "./plugin/PluginRenderer";
import ProjectRenderer from "./project/ProjectRenderer";
// import RichTextRenderer from "./richtext/RichTextRenderer";
import styles from "./DocumentView.module.css";

type Props = {
  id: Identifier;
  isNested?: boolean;
  hideDocumentMenu?: boolean;
};

/**
 * Load a Resource based on a URL (owner/document).
 * When a resource is loaded and has a supported type, load the corresponding renderer
 */
const DocumentView = observer((props: Props) => {
  const [connection, setConnection] = useState<DocConnection>();

  React.useEffect(() => {
    const newConnection = DocConnection.load(props.id);

    setConnection(newConnection);
    // for testing:
    // setTimeout(() => {
    //   setConnection(undefined);
    // }, 10000);
    return () => {
      newConnection.dispose();
      setConnection(undefined);
    };
  }, [props.id]);

  if (!connection) {
    return null;
  }
  if (connection.doc === "loading") {
    return <div>Loading</div>;
  } else if (connection.doc === "not-found") {
    return <div>Not found</div>;
  }
  if (!connection.doc.type) {
    console.warn("possibly corrupt document");
    return <div>Loading</div>;
  }
  if (connection.doc.type === "!notebook") {
    const doc = connection.doc.doc;

    return (
      <div className={styles.view}>
        {!props.hideDocumentMenu && (
          <DocumentMenu document={doc}></DocumentMenu>
        )}
        <NotebookRenderer key={connection.doc.id} document={doc} />
      </div>
    );
  } else if (connection.doc.type === "!project") {
    if (props.isNested) {
      return (
        <div className={styles.view}>
          {!props.hideDocumentMenu && (
            <DocumentMenu document={connection.doc}></DocumentMenu>
          )}
          <ProjectRenderer
            isNested={true}
            key={connection.doc.id}
            project={connection.doc.getSpecificType(ProjectResource)!}
          />
        </div>
      );
    } else {
      return (
        <ProjectRenderer
          key={connection.doc.id}
          project={connection.doc.getSpecificType(ProjectResource)!}
        />
      );
    }
  } else if (connection.doc.type === "!richtext") {
    throw new Error("richtext not implemented");
    // return (
    //   <div className={styles.view}>
    //     {!props.hideDocumentMenu && (
    //       <DocumentMenu document={connection.doc}></DocumentMenu>
    //     )}
    //     <RichTextRenderer
    //       key={connection.doc.id}
    //       document={connection.doc.doc}
    //     />
    //   </div>
    // );
  } else if (connection.doc.type === "!plugin") {
    return (
      <PluginRenderer
        key={connection.doc.id}
        plugin={connection.doc.getSpecificType(PluginResource)!}
      />
    );
  } else if (connection.doc.type.startsWith("!")) {
    throw new Error("invalid built in type");
  } else {
    throw new Error("CustomRenderer not implemented");
    // return <CustomRenderer key={connection.doc.id} document={connection.doc} />;
  }
});

export default DocumentView;

/*

/doc/file

/file:index.md/doc


index.md:

type:
---
*/
