/** @jsxImportSource @emotion/react */
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Identifier } from "../../identifiers/Identifier";
import { MonacoContext } from "../../runtime/editor/MonacoContext";
import { DocumentResource } from "../../store/DocumentResource";
import { getStoreService } from "../../store/local/stores";
import { UnreachableCaseError } from "../../util/UnreachableCaseError";
import DocumentView from "../documentRenderers/DocumentView";
import { Navigation } from "./components/Navigation";
import { NotebookOverview } from "./components/NotebookOverview";
import NewPageDialog from "./components/NewPageDialog";
import styles from "./Main.module.css";

type Props = {
  currentPage: {
    page: "document",
    identifier: Identifier
  } | {
    page: "root"
  } |
  {
    page: "owner",
    owner: string
  }
}

const Page = observer((props: Props) => {
  let content;

  switch (props.currentPage.page) {
    case "root":
      content = <NotebookOverview></NotebookOverview>
      break;
    case "document":
      content = <DocumentView id={props.currentPage.identifier} />;
      break
    case "owner":
      content = <div>Profile: {props.currentPage.owner}</div>;
      break;
    default:
      throw new UnreachableCaseError(props.currentPage);
  }

  return <div className={styles.page}>
    {content}
  </div>
})

const Main = observer((props: Props) => {
  const sessionStore = getStoreService().sessionStore;
  const navigationStore = getStoreService().navigationStore;
  return (
    <MonacoContext.Provider value={{ monaco }}>
      <DndProvider backend={HTML5Backend}>
        <div className={styles.main}>
          <Navigation />
          {sessionStore.user === "loading" ? (
            <div>Loading</div>
          ) : sessionStore.user === "offlineNoUser" ? (
            <div>Offline</div>
          ) : <Page currentPage={props.currentPage} />}
          {sessionStore.loggedInUser && (
            <NewPageDialog
              ownerId={sessionStore.loggedInUser}
              close={navigationStore.hideNewPageDialog}
              isOpen={navigationStore.isNewPageDialogVisible}
            />
          )}
        </div>
      </DndProvider>
    </MonacoContext.Provider>
  );
});

export default Main;

(window as any).DocumentResource = DocumentResource; // TODO: hacky
