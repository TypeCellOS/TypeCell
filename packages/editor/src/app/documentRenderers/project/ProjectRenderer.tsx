import { observer } from "mobx-react-lite";
import React from "react";
import { path } from "vscode-lib";
import { parseIdentifier } from "../../../identifiers";
import { Identifier } from "../../../identifiers/Identifier";
import { getStoreService } from "../../../store/local/stores";
import ProjectResource from "../../../store/ProjectResource";
import DocumentView from "../DocumentView";
import FolderView from "./directoryNavigation/FolderView";
import SidebarTree from "./directoryNavigation/SidebarTree";
import { filesToTreeNodes } from "./directoryNavigation/treeNodeUtil";
import styles from "./ProjectRenderer.module.css";
type Props = {
  project: ProjectResource;
  isNested?: boolean;
};

const ProjectRenderer: React.FC<Props> = observer((props) => {
  // const fileSet = useRef(new ObservableSet<string>());
  const identifier = props.project.identifier;
  // if (!(identifier instanceof FileIdentifier)) {
  //   throw new Error("no file identifier");
  // }
  // let subIdentifierStr = identifier.subIdentifier;
  // let subIdentifier = subIdentifierStr
  //   ? tryParseIdentifier(subIdentifierStr)
  //   : undefined;

  const files = Array.from(props.project.files.keys()).sort();

  const tree = filesToTreeNodes(
    files.map((f) => ({
      fileName: f,
    }))
  );

  const navigationStore = getStoreService().navigationStore;

  const onClick = (item: string) => {
    if (!props.isNested) {
      navigationStore.currentDocument!.identifier.subPath = item;
    } else {
      let subPath = navigationStore.currentDocument!.identifier.subPath;
      subPath = subPath ? path.join(subPath, item) : item;
      navigationStore.currentDocument!.identifier.subPath = subPath;
    }
    // identifier.subPath = item;
  };

  let mainContent = <div></div>; // no content by default
  let documentIdentifier: Identifier | undefined;

  if (identifier.subPath) {
    documentIdentifier = parseIdentifier(
      identifier.fullUriOfSubPath()!.toString()
    );
    mainContent = <DocumentView id={documentIdentifier} isNested={true} />;
  } else {
    // A directory listing
    let defaultFile = files.find((f) => f === "README.md");
    if (defaultFile) {
      // Directory listing with a default file
      let idTemp = parseIdentifier(identifier.uri.toString());
      idTemp.subPath = defaultFile;
      documentIdentifier = parseIdentifier(
        idTemp.fullUriOfSubPath()!.toString()
      );
      mainContent = (
        <DocumentView
          hideBreadcrumb={true}
          id={documentIdentifier}
          isNested={true}
        />
      );
    }
  }

  if (props.isNested) {
    return (
      <div>
        <div className={styles.folderContainer}>
          <FolderView onClick={onClick} tree={tree} />
        </div>
        {mainContent}
      </div>
    );
  } else {
    return (
      <div className={styles.projectContainer}>
        <div className={styles.sidebarContainer}>
          <SidebarTree onClick={onClick} tree={tree} />
        </div>
        {mainContent}
      </div>
    );
  }
});

export default ProjectRenderer;
