import {
  Content,
  LeftSidebar,
  LeftSidebarState,
  PageLayout,
} from "@atlaskit/page-layout";
import { TreeData, TreeItem } from "@atlaskit/tree";
import { observer } from "mobx-react-lite";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { path } from "vscode-lib";
import { parseIdentifier } from "../../../identifiers";
import { BaseResource } from "../../../store/BaseResource";
import { DocConnection } from "../../../store/DocConnection";
import ProjectResource from "../../../store/ProjectResource";
import { ChildReference } from "../../../store/referenceDefinitions/child";
import styles from "./ProjectContainer.module.css";
import SidebarTree from "./directoryNavigation/SidebarTree";

type Props = {
  project: ProjectResource;
  isNested?: boolean;
};

let id = 0;

function docToTreeItem(
  doc: BaseResource,
  items: Record<string, TreeItem>,
  root = false
) {
  const children = doc.getRefs(ChildReference);
  const childrenWithDocs = children.map((c) => {
    const doc = DocConnection.get(c.target);
    const resource = doc?.tryDoc;
    return {
      doc: resource,
      id: c.target,
    };
  });

  const childrenWithLoadedDocs = childrenWithDocs.filter(
    (c) => c.doc !== undefined
  );
  const isChildrenLoading = childrenWithLoadedDocs.length !== children.length;

  const childrenIds: string[] = [];

  childrenWithLoadedDocs.forEach((c) => {
    if (c.doc) {
      childrenIds.push(docToTreeItem(c.doc, items).id as string);
    }
  });

  let i = 0;
  let id = doc.id + "-" + i;

  while (items[id]) {
    id = doc.id + "-" + ++i;
  }
  const ret: TreeItem = {
    id,
    isChildrenLoading,
    children: childrenIds,
    hasChildren: children.length > 0,
    isExpanded: root,
    data: {
      id: doc.id,
      allChildren: children.map((c) => c.target),
    },
  };

  items[id] = ret;
  return ret;
}

function docToAkTree(doc: BaseResource) {
  const items: Record<string, TreeItem> = {};
  const rootItem = docToTreeItem(doc, items, true);
  const root: TreeData = {
    rootId: rootItem.id,
    items,
    // id: doc.id,
    // children: [],
    // hasChildren: false,
    // isExpanded: false,
    // isChildrenLoading: false,
    // data: {
  };
  return root;
}

const ProjectContainer = observer((props: Props) => {
  // return <div>hello123</div>;
  const location = useLocation();
  const navigate = useNavigate();

  const tree = docToAkTree(props.project);
  // const files = Array.from(props.project.files.keys()).sort();

  // const tree = filesToTreeNodes(
  //   files.map((f) => ({
  //     fileName: f,
  //   }))
  // );

  const onClick = (item: string) => {
    const isDocs = location.pathname.startsWith("/docs");
    const id = parseIdentifier(item);
    debugger;
    navigate({
      pathname: props.isNested
        ? path.join(location.pathname, "/", item)
        : isDocs
        ? id.uri.path
        : "/" + props.project.identifier.toString() + ":/" + item,
    });
  };

  // let defaultFile = files.find((f) => f === "README.md");
  let defaultFileContent = <></>;
  // if (defaultFile) {
  //   // TODO: cleanup?
  //   // Directory listing with a default file
  //   let idTemp = parseIdentifier(props.project.identifier.uri.toString());
  //   idTemp.subPath = defaultFile;
  //   let documentIdentifier = parseIdentifier(
  //     idTemp.fullUriOfSubPath()!.toString()
  //   );
  //   defaultFileContent = (
  //     <DocumentView
  //       hideDocumentMenu={true}
  //       id={documentIdentifier}
  //       isNested={true}
  //     />
  //   );
  // }

  if (props.isNested) {
    return (
      <div>
        <div className={styles.folderContainer}>
          {/* <FolderView onClick={onClick} tree={tree} /> */}
        </div>
        {/* {defaultFileContent} */}
      </div>
    );
  } else {
    return (
      <div className={styles.projectContainer}>
        <PageLayout
          onLeftSidebarExpand={(state: LeftSidebarState) =>
            console.log("onExpand", state)
          }
          onLeftSidebarCollapse={(state: LeftSidebarState) =>
            console.log("onCollapse", state)
          }>
          <Content testId="content">
            <LeftSidebar
              testId="left-sidebar"
              id={styles.leftSidebar}
              isFixed={false}
              collapsedState="expanded"
              onResizeStart={(state: LeftSidebarState) =>
                console.log("onResizeStart", state)
              }
              onResizeEnd={(state: LeftSidebarState) =>
                console.log("onResizeEnd", state)
              }
              onFlyoutExpand={() => console.log("onFlyoutExpand")}
              onFlyoutCollapse={() => console.log("onFlyoutCollapse")}
              // overrides={{
              //   ResizeButton: {
              //     render: (Component, props) => (

              //       // <Tooltip
              //       //   content={props.isLeftSidebarCollapsed ? "Expand" : "Collapse"}
              //       //   hideTooltipOnClick
              //       //   position="right"
              //       //   testId="tooltip">
              //       <Component {...props} />
              //       // </Tooltip>
              //     ),
              //   },
              // }}
            >
              <div style={{ padding: 10 }}>
                <SidebarTree onClick={onClick} tree={tree} />
              </div>
            </LeftSidebar>
            {/* <div className={styles.sidebarContainer}>
              <SidebarTree onClick={onClick} tree={tree} />
            </div> */}
            {/* {defaultFileContent} */}
            <div style={{ flex: 1 }}>
              <Outlet
                context={{
                  defaultFileContent,
                  parentIdentifier: props.project.identifier,
                }}
              />
            </div>
          </Content>
        </PageLayout>
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
