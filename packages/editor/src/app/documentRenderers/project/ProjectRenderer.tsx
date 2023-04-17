import { observer } from "mobx-react-lite";
import React from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import { parseIdentifier } from "../../../identifiers";
import { Identifier } from "../../../identifiers/Identifier";
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
  const documentIdentifier = parseIdentifier(sub);
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

  const isDocs = path.pathname.startsWith("/docs");
  debugger;
  const rootPath = isDocs ? "docs" : identifier.toString();
  console.log(path, "ppp", isDocs, rootPath, identifier.toRouteString());

  return (
    <Routes>
      <Route
        path={rootPath + (identifier.subPath ? ":/" : "")}
        element={<ProjectContainer project={props.project} />}>
        <Route path="*" element={<NestedDocument parent={identifier} />} />
        <Route index element={<RootDirectory />} />
        {isDocs ? (
          <Route path="*" element={<NestedDocument parent={identifier} />} />
        ) : (
          <Route path="*" element={<NestedDocument parent={identifier} />} />
        )}
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
