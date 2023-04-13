import { observer } from "mobx-react-lite";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { path } from "vscode-lib";
import { parseIdentifier } from "../../../identifiers";
import ProjectResource from "../../../store/ProjectResource";
import DocumentView from "../DocumentView";
import styles from "./ProjectRenderer.module.css";
import FolderView from "./directoryNavigation/FolderView";
import SidebarTree from "./directoryNavigation/SidebarTree";
import { filesToTreeNodes } from "./directoryNavigation/treeNodeUtil";

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

/**
 
DocA
  - DocB
    - DocD
  - DocC

  DocB.children = [DocD]
  DocD.parent = DocB

  // reparent 1
  DocB.children = [] // what if no access?
  DocC.children = [DocD]
  DocD.parent = DocC

  // reparent 2
  DocB.children = []
  DocA.children = [DocD]
  DocD.parent = DocA

  // conflict
  - DocA
    - DocB
    - DocC
      - DocD
    - DocD

 */

// Doc A:
// <child id="b" clock="b1234">

// Doc B has an inbox with the following messages:
// <parent id="b" clock="a1234" />
// <parent id="c" clock="b1234" />
// <parent id="d" clock="d1234" />
// <parent id="e" clock="c1234" from="" />

//     I get Doc A, it refers to a child. Is this ok?
//     Get Doc B.
//       - It's not at clock. We can't validate the child / parent rel because we're not synced yet
//       - it is at clock. Check if update has been subsumed
//         - check c.
//           - it's not at clock.

//     BackRef validation algorithm:
//       - keep an inbox of validated messages
//       - load next message that should be validated
//         - if other document is not at clock, keep in queue because we're not synced yet, continue next
//         - if document is at clock, validate
//           - if document contains message, accept message as truth. mark validated and wait until it becomes invalid before checking the next message
//           - if document does not contain message, ignore message. mark validated and continue next

// Issue:
// - User Alice doesn't have access to B, but moves it's child c1 from B to C
// - this is fine, other clients won't validate her message because B still contains c1
// - Bob then moves child c1 from B to D
// - Alice's message is now valid, because B no longer contains c1. Bob's message won't be processed

// too complicated. use a different approach where children can have multiple parents and they'll be shown as "copy" if so. oldest = original
