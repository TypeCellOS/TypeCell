/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useState } from "react";
import { Identifier } from "../../identifiers/Identifier";
import { DocConnection } from "../../store/DocConnection";

import ProjectResource from "../../store/ProjectResource";

// import { MenuBar } from "../maidocn/components/menuBar/MenuBar";
// import RichTextRenderer from "./richtext/RichTextRenderer";
import styles from "./DocumentView.module.css";
// import { CustomRenderer } from "./custom/CustomRenderer";
import ProfileResource from "../../store/ProfileResource";
import { SessionStore } from "../../store/local/SessionStore";
import { DocumentMenu } from "../main/components/documentMenu/DocumentMenu";

import ProfileRenderer from "./profile/ProfileRenderer";
import ProjectContainer from "./project/ProjectContainer";
import ProjectRenderer from "./project/ProjectRenderer";
import RichTextRenderer from "./richtext/RichTextRenderer";

type Props = {
  id: Identifier;
  subIdentifiers: Identifier[];
  isNested?: boolean;
  hideDocumentMenu?: boolean;
  sessionStore: SessionStore;
};

/**
 * Load a Resource based on a URL (owner/document).
 * When a resource is loaded and has a supported type, load the corresponding renderer
 */
const DocumentView = observer((props: Props) => {
  const [connection, setConnection] = useState<DocConnection>();

  React.useEffect(() => {
    const newConnection = DocConnection.load(props.id, props.sessionStore);

    setConnection(newConnection);
    // for testing:
    // setTimeout(() => {
    //   setConnection(undefined);
    // }, 10000);
    return () => {
      newConnection.dispose();
      setConnection(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id.toString(), props.sessionStore]);

  if (!connection) {
    return null;
  }
  if (connection.doc === "loading") {
    return <div>Loading doc</div>;
  } else if (connection.doc === "not-found") {
    return <div>Not found</div>;
  }
  if (!connection.doc.type) {
    console.warn("possibly corrupt document");
    return <div>Loading</div>;
  }
  if (connection.doc.type === "!notebook") {
    throw new Error("Notebook not implemented");
  } else if (connection.doc.type === "!project") {
    if (props.isNested) {
      return (
        <div className={styles.view}>
          {!props.hideDocumentMenu && (
            <DocumentMenu
              document={connection.doc.getSpecificType(ProjectResource)!}
              sessionStore={props.sessionStore}></DocumentMenu>
          )}
          <ProjectContainer
            isNested={true}
            key={connection.doc.id}
            project={connection.doc.getSpecificType(ProjectResource)!}
            sessionStore={props.sessionStore}
          />
        </div>
      );
    } else {
      return (
        <ProjectRenderer
          key={connection.doc.id}
          project={connection.doc.getSpecificType(ProjectResource)!}
          subIdentifiers={props.subIdentifiers}
          sessionStore={props.sessionStore}
        />
      );
    }
  } else if (connection.doc.type === "!richtext") {
    const doc = connection.doc.doc;

    return (
      <div className={styles.view}>
        {!props.hideDocumentMenu && (
          <DocumentMenu
            document={doc}
            sessionStore={props.sessionStore}></DocumentMenu>
        )}
        <RichTextRenderer
          key={connection.doc.id}
          document={connection.doc.doc!}
          sessionStore={props.sessionStore}
        />
      </div>
    );
  } else if (connection.doc.type === "!plugin") {
    throw new Error("Plugin not implemented");
  } else if (connection.doc.type === "!profile") {
    return (
      <div className={styles.view}>
        <DocumentMenu
          document={connection.doc}
          sessionStore={props.sessionStore}></DocumentMenu>
        <ProfileRenderer
          key={connection.doc.id}
          profile={connection.doc.getSpecificType(ProfileResource)!}
          subIdentifiers={[]}
          sessionStore={props.sessionStore}
        />
      </div>
    );
  } else if (connection.doc.type.startsWith("!")) {
    throw new Error("invalid built in type");
  } else {
    throw new Error("CustomRenderer not implemented");
    // return <CustomRenderer key={connection.doc.id} document={connection.doc} />;
  }
});

export default React.memo(DocumentView);

/*

/doc/file

/file:index.md/doc


index.md:

type:
---
*/
