import { IndexFileReference } from "@typecell-org/shared";
import { observer } from "mobx-react-lite";
import React from "react";
import { parseIdentifier } from "../../../identifiers";
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
  let [childId, ...remainingIds] = props.subIdentifiers;

  if (!childId) {
    const children = props.project.getRefs(IndexFileReference);
    if (children.length) {
      childId = parseIdentifier(children[0].target);
      remainingIds = [];
    }
  }
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
        <div>
          {props.project.identifier.toString()}
          {props.subIdentifiers.length}
          <RootDirectory />
        </div>
      )}
    </ProjectContainer>
  );
});

export default ProjectRenderer;
