import { observer } from "mobx-react-lite";
import React from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import { Identifier } from "../../../identifiers/Identifier";
import {
  getIdentifierFromPath,
  getPathFromIdentifier,
  pathToIdentifiers,
} from "../../../identifiers/v2/Identifier";
import ProjectResource from "../../../store/ProjectResource";
import DocumentView from "../DocumentView";
import ProjectContainer from "./ProjectContainer";

type Props = {
  project: ProjectResource;
  isNested?: boolean;
};

const NestedDocument = (props: { parent: Identifier }) => {
  const params = useParams();
  const sub = params["*"] as string;

  // const newIdStr = path.join(props.parent.toString(), "/:/", sub);
  const documentIdentifier = getIdentifierFromPath(sub, [props.parent]);
  // parseIdentifier(newIdStr).fullUriOfSubPath()!.toString()
  // );
  // return <div>{sub}</div>;
  return <DocumentView id={documentIdentifier} isNested={true} />;
};

const RootDirectory = (props: {}) => {
  return <div>hello</div>;
  // const defaultDoc = (useOutletContext() as any)?.defaultFileContent as any;
  // return defaultDoc || <></>;
};

// const Debug = (props: { children: any }) => {
//   const params = useParams();
//   return (
//     <div>
//       <div>params: {JSON.stringify(params)}</div>
//       {props.children}
//     </div>
//   );
// };
const ProjectRenderer: React.FC<Props> = observer((props) => {
  // const fileSet = useRef(new ObservableSet<string>());
  const identifier = props.project.identifier;
  const path = useLocation();
  const subPath = (useParams() as any).subPath;
  if (subPath) {
    throw new Error("unexpected");
  }

  const identifiers = pathToIdentifiers(path.pathname.substring(1));
  const idPath = getPathFromIdentifier(identifier);
  let matchedPath: string;
  let sep = ":/";
  if (typeof idPath === "string") {
    matchedPath = idPath;
  } else {
    if (path.pathname.substring(1).startsWith(idPath.shorthand)) {
      matchedPath = idPath.shorthand;
      sep = "/";
    } else {
      matchedPath = idPath.path;
    }
  }

  return (
    <Routes>
      <Route
        path={matchedPath + (identifiers.length ? sep : "")}
        element={<ProjectContainer project={props.project} />}>
        <Route path="*" element={<NestedDocument parent={identifier} />} />
        <Route index element={<RootDirectory />} />
        <Route path="*" element={<NestedDocument parent={identifier} />} />
      </Route>
      {/* <Route
        path="*"
        element={
          <Debug>
            errorsdf {rootPath} {path.pathname} {identifier.toRouteString()}
          </Debug>
        }
      /> */}
    </Routes>
  );
});

export default ProjectRenderer;
