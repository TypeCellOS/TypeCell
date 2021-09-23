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
  switch (props.currentPage.page) {
    case "root":
      return <div>Welcome to Typecell</div>;
    case "document":
      return <DocumentView id={props.currentPage.identifier} />;
    case "owner":
      return <div>Profile: {props.currentPage.owner}</div>
    default:
      throw new UnreachableCaseError(props.currentPage);
  }
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
          {/* <FlagGroup>
        <>
          {notebookStore.showFreezeAlert && (
            <FreezeAlert
              onDismiss={notebookStore.dismissFreezeAlert}
              onLoadSafeMode={notebookStore.loadSafeMode}
            />
          )}
        </>
      </FlagGroup> */}
        </div>
      </DndProvider>
    </MonacoContext.Provider>
  );
});

export default Main;

(window as any).DocumentResource = DocumentResource; // TODO: hacky

// const notebookStore = new NotebookStore(userStore);
/*
const FreezeAlert = (props: {
  onDismiss: () => void;
  onLoadSafeMode: () => void;
}) => {
  return (
    <Flag
      css={{
        zIndex: 2000,
        backgroundColor: "rgb(222, 53, 11)",
      }}
      appearance="error"
      icon={
        <VscWarning
          css={{
            width: "24px",
            height: "24px",
            padding: "2px",
          }}
        />
      }
      id="error"
      key="error"
      title="The document is not responding"
      description="It seems like your document has frozen. Perhaps there is an infinite loop in the code?
    You can load the document in safe mode to fix any code errors."
      actions={[
        { content: "Dismiss", onClick: props.onDismiss },
        { content: "Reload in safe mode", onClick: props.onLoadSafeMode },
      ]}
    />
  );
};*/
