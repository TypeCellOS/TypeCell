import { observer } from "mobx-react-lite";
import React from "react";
import { Link, Outlet, Route, Routes, useNavigate } from "react-router-dom";
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

type Props = {};

const DirectoryListing: React.FC<Props> = observer((props) => {
  // const fileSet = useRef(new ObservableSet<string>());
  return <div>directory</div>;
});

export default DirectoryListing;
