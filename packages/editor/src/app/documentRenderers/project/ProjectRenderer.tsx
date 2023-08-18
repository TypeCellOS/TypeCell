import { observer } from "mobx-react-lite";
import React from "react";
import { Identifier } from "../../../identifiers/Identifier";
import ProjectResource from "../../../store/ProjectResource";
import { SessionStore } from "../../../store/local/SessionStore";
import DocumentView from "../DocumentView";
import ProjectContainer from "./ProjectContainer";

type Props = {
  project: ProjectResource;
  isNested?: boolean;
  subIdentifiers: Identifier[];
  sessionStore: SessionStore;
};

const RootDirectory = () => {
  return <div>hello</div>;
  // const defaultDoc = (useOutletContext() as any)?.defaultFileContent as any;
  // return defaultDoc || <></>;
};

const ProjectRenderer: React.FC<Props> = observer((props) => {
  const [childId, ...remainingIds] = props.subIdentifiers;
  return (
    <ProjectContainer
      project={props.project}
      activeChild={childId}
      sessionStore={props.sessionStore}>
      {childId ? (
        <DocumentView
          id={childId}
          isNested={true}
          subIdentifiers={remainingIds}
          sessionStore={props.sessionStore}
        />
      ) : (
        <RootDirectory />
      )}
    </ProjectContainer>
  );
});

export default ProjectRenderer;
