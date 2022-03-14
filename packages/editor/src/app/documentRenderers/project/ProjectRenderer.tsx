import { observer } from "mobx-react-lite";
import React from "react";
import {
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { path } from "vscode-lib";
import { parseIdentifier } from "../../../identifiers";
import { Identifier } from "../../../identifiers/Identifier";
import { getStoreService } from "../../../store/local/stores";
import ProjectResource from "../../../store/ProjectResource";
import DocumentView from "../DocumentView";
import DirectoryListing from "./DirectoryListing";
import FolderView from "./directoryNavigation/FolderView";
import SidebarTree from "./directoryNavigation/SidebarTree";
import { filesToTreeNodes } from "./directoryNavigation/treeNodeUtil";
import ProjectContainer from "./ProjectContainer";
import styles from "./ProjectRenderer.module.css";

type Props = {
  project: ProjectResource;
  isNested?: boolean;
};

const NestedDocument = () => {
  const location = useLocation();
  const documentIdentifier = parseIdentifier(
    parseIdentifier(location.pathname.substring(1))
      .fullUriOfSubPath()!
      .toString()
  );
  // return <div>{location.pathname}</div>;
  return <DocumentView id={documentIdentifier} isNested={true} />;
};

const ProjectRenderer2: React.FC<Props> = observer((props) => {
  // const fileSet = useRef(new ObservableSet<string>());
  const identifier = props.project.identifier;
  const navigate = useNavigate();
  const path = useLocation();

  const subPath = (useParams() as any).subPath;
  if (subPath) {
    throw new Error("unexpected");
  }
  const rootPath = identifier.toString();

  return (
    <Routes>
      <Route
        path={rootPath}
        element={<ProjectContainer project={props.project} />}>
        <Route index element={<div>directory {rootPath}</div>} />
        <Route path=":/:subPath/*" element={<NestedDocument />} />
      </Route>
      <Route
        path="*"
        element={
          <div>
            error {rootPath} {path.pathname} {identifier.toRouteString()}
          </div>
        }
      />
    </Routes>
  );
});

export default ProjectRenderer2;
