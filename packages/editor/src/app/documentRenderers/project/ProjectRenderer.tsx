import { observer } from "mobx-react-lite";
import React from "react";
import { parseIdentifier } from "../../../identifiers";
import { Identifier } from "../../../identifiers/Identifier";
import { getStoreService } from "../../../store/local/stores";
import ProjectResource from "../../../store/ProjectResource";
import DocumentView from "../DocumentView";
import SidebarTree from "./sidebar";

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
  const navigationStore = getStoreService().navigationStore;

  const onClick = (item: string) => {
    if (!props.isNested) {
      navigationStore.currentDocument!.identifier.subPath = item;
    } else {
      let subPath = navigationStore.currentDocument!.identifier.subPath;
      subPath = subPath ? subPath + "/" + item : item;
      navigationStore.currentDocument!.identifier.subPath = subPath;
    }
    // identifier.subPath = item;
  };
  // useEffect(() => {
  //   const watcher = new Watcher("./**/*.md"); // TODO
  //   const events: any[] = [];
  //   watcher.onWatchEvent((e) => {
  //     events.push(e);
  //   });
  //   setInterval(() => {
  //     let e: any;
  //     runInAction(() => {
  //       while ((e = events.pop())) {
  //         if (e.event === "unlink") {
  //           fileSet.current.delete(e.path);
  //         } else if (e.event === "add") {
  //           fileSet.current.add(e.path);
  //         }
  //       }
  //     });
  //   }, 1000);
  // }, [identifier]);

  let mainContent = <div>No content.</div>;
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

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: props.isNested ? "column" : "row",
        alignItems: "stretch",
        overflow: "hidden",
      }}>
      <div
        style={{
          maxWidth: !props.isNested ? "400px" : "",
          minWidth: "250px",
          position: "relative",
          zIndex: 9999999,
          background: "white",
          borderRight: !props.isNested ? "1px solid rgb(239, 241, 244)" : "",
          borderBottom: props.isNested ? "1px solid rgb(239, 241, 244)" : "",
          padding: "20px",
          overflowY: !props.isNested ? "auto" : undefined,
        }}>
        <SidebarTree onClick={onClick} fileSet={files} />
      </div>
      {mainContent}
    </div>
  );
});

export default ProjectRenderer;
