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
import { StartScreen } from "./components/startscreen/StartScreen";
import styles from "./Main.module.css";
import Profile from "./components/Profile";
import PermissionsDialog from "./components/permissions/PermissionsDialog";

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
      return <Profile owner={props.currentPage.owner} />;
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
        {sessionStore.loggedInUserId && (
          <NewNotebookDialog
            ownerId={sessionStore.loggedInUserId}
            close={navigationStore.hideNewNotebookDialog}
            isOpen={navigationStore.isNewNotebookDialogVisible}
          />
        )}
        {navigationStore.userCanEditPermissions && (
          <PermissionsDialog
            user={sessionStore.loggedInUserId?.substring(1)}
            close={navigationStore.hidePermissionsDialog}
            isOpen={navigationStore.isPermissionsDialogVisible}
          />
        )}

        {sessionStore.loggedInUserId && (
          <NewNotebookDialog
            ownerId={sessionStore.loggedInUserId}
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
