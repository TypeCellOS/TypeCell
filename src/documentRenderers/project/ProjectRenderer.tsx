import { ObservableSet, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import { Watcher } from "../../github/file";
import { FileIdentifier } from "../../identifiers/FileIdentifier";

import ProjectResource from "../../store/ProjectResource";
import { URI } from "../../util/vscode-common/uri";
import DocumentView from "../DocumentView";
import SidebarTree from "./sidebar";

type Props = {
  project: ProjectResource;
};

const ProjectRenderer: React.FC<Props> = observer((props) => {
  // const fileSet = useRef(new ObservableSet<string>());
  const identifier = props.project.identifier;
  if (!(identifier instanceof FileIdentifier)) {
    throw new Error("no file identifier");
  }
  // let subIdentifierStr = identifier.subIdentifier;
  // let subIdentifier = subIdentifierStr
  //   ? tryParseIdentifier(subIdentifierStr)
  //   : undefined;

  const files = Array.from(props.project.files.keys()).sort().reverse();

  const onClick = (item: string) => {
    identifier.subPath = item;
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
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
      }}>
      <div
        style={{
          width: "400px",
          position: "relative",
          zIndex: 9999999,
          background: "white",
          borderRight: "1px solid rgb(239, 241, 244)",
          padding: "20px",
          overflowY: "auto",
        }}>
        <SidebarTree onClick={onClick} fileSet={files} />
      </div>
      {identifier.subPath && (
        <DocumentView
          id={
            new FileIdentifier(
              identifier.uri.with({ path: identifier.subPath })
            )
          }
        />
      )}
    </div>
  );
});

export default ProjectRenderer;
