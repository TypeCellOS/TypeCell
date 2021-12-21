/** @jsxImportSource @emotion/react */
import { observer } from "mobx-react-lite";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Identifier } from "../../identifiers/Identifier";
import { DocumentResource } from "../../store/DocumentResource";
import { getStoreService } from "../../store/local/stores";
import { UnreachableCaseError } from "../../util/UnreachableCaseError";
import DocumentView from "../documentRenderers/DocumentView";
import { Navigation } from "./components/Navigation";
import NewNotebookDialog from "./components/NewNotebookDialog";
import { StartScreen } from "./components/StartScreen";
import styles from "./Main.module.css";

type Props = {
  currentPage:
    | {
        page: "document";
        identifier: Identifier;
      }
    | {
        page: "root";
      }
    | {
        page: "owner";
        owner: string;
      };
};

const Page = observer((props: Props) => {
  switch (props.currentPage.page) {
    case "root":
      return <StartScreen></StartScreen>;
    case "document":
      return <DocumentView id={props.currentPage.identifier} />;
    case "owner":
      return <div>Profile: {props.currentPage.owner}</div>;
    default:
      throw new UnreachableCaseError(props.currentPage);
  }
});

const Main = observer((props: Props) => {
  const sessionStore = getStoreService().sessionStore;
  const navigationStore = getStoreService().navigationStore;
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.main}>
        <Navigation />
        {sessionStore.user === "loading" ? (
          <div>Loading</div>
        ) : sessionStore.user === "offlineNoUser" ? (
          <div>Offline</div>
        ) : (
          <Page currentPage={props.currentPage} />
        )}
        {sessionStore.loggedInUser && (
          <NewNotebookDialog
            ownerId={sessionStore.loggedInUser}
            close={navigationStore.hideNewNotebookDialog}
            isOpen={navigationStore.isNewNotebookDialogVisible}
          />
        )}
      </div>
    </DndProvider>
  );
});

export default Main;

(window as any).DocumentResource = DocumentResource; // TODO: hacky
