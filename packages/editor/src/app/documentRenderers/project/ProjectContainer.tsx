import { observer } from "mobx-react-lite";
import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { path } from "vscode-lib";
import { parseIdentifier } from "../../../identifiers";
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

const ProjectContainer = observer((props: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const files = Array.from(props.project.files.keys()).sort();

  const tree = filesToTreeNodes(
    files.map((f) => ({
      fileName: f,
    }))
  );

  const onClick = (item: string) => {
    const isDocs = location.pathname.startsWith("/docs");

    navigate({
      pathname: props.isNested
        ? path.join(location.pathname, "/", item)
        : isDocs
        ? item
        : ":/" + item,
    });
  };
  let defaultFile = files.find((f) => f === "README.md");
  let defaultFileContent = <></>;
  if (defaultFile) {
    // TODO: cleanup?
    // Directory listing with a default file
    let idTemp = parseIdentifier(props.project.identifier.uri.toString());
    idTemp.subPath = defaultFile;
    let documentIdentifier = parseIdentifier(
      idTemp.fullUriOfSubPath()!.toString()
    );
    defaultFileContent = (
      <DocumentView
        hideDocumentMenu={true}
        id={documentIdentifier}
        isNested={true}
      />
    );
  }

  if (props.isNested) {
    return (
      <div>
        <div className={styles.folderContainer}>
          <FolderView onClick={onClick} tree={tree} />
        </div>
        {defaultFileContent}
      </div>
    );
  } else {
    return (
      <div className={styles.projectContainer}>
        <div className={styles.sidebarContainer}>
          <SidebarTree onClick={onClick} tree={tree} />
        </div>
        {/* {defaultFileContent} */}
        <Outlet
          context={{
            defaultFileContent,
            parentIdentifier: props.project.identifier,
          }}
        />
      </div>
    );
  }
});

export default ProjectContainer;
