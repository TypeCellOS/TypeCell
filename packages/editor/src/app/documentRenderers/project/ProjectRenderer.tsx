import { ChildReference, IndexFileReference } from "@typecell-org/shared";
import { observer } from "mobx-react-lite";
import React from "react";
import { parseIdentifier } from "../../../identifiers";
import { Identifier } from "../../../identifiers/Identifier";
import ProjectResource from "../../../store/ProjectResource";
import { SessionStore } from "../../../store/local/SessionStore";
import DocumentView from "../DocumentView";
import ProjectContainer from "./ProjectContainer";

import EmptyState from "@atlaskit/empty-state";

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
    const indexFile = props.project.getRefs(IndexFileReference);
    if (indexFile.length) {
      childId = parseIdentifier(indexFile[0].target);
      remainingIds = [];
    }
  }

  if (!childId) {
    const children = props.project.getRefs(ChildReference);
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
          <EmptyState
            header="No page found yet!"
            description="Add a page using the sidebar on the left-hand side."
            // primaryAction={<Button appearance="primary">Request access</Button>}
            // secondaryAction={<Button>View permissions</Button>}
            // tertiaryAction={<Button appearance="link">Learn more</Button>}
          />
        </div>
      )}
    </ProjectContainer>
  );
});

export default ProjectRenderer;
