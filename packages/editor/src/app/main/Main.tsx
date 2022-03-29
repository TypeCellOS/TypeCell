/** @jsxImportSource @emotion/react */
import { observer } from "mobx-react-lite";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DocumentResource } from "../../store/DocumentResource";
import { getStoreService } from "../../store/local/stores";
import {
  CloseNewNotebookDialog,
  IsNewNotebookDialogOpen,
} from "../routes/routes";
import { Navigation } from "./components/Navigation";
import NewNotebookDialog from "./components/NewNotebookDialog";
import styles from "./Main.module.css";

const Main = observer((props: {}) => {
  const sessionStore = getStoreService().sessionStore;

  let location = useLocation();
  let navigate = useNavigate();
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.main}>
        <Navigation />
        <Outlet />
        {sessionStore.loggedInUserId && (
          <NewNotebookDialog
            ownerId={sessionStore.loggedInUserId}
            close={() => CloseNewNotebookDialog(navigate)}
            isOpen={IsNewNotebookDialogOpen(location)}
          />
        )}
      </div>
    </DndProvider>
  );
});

export default Main;

(window as any).DocumentResource = DocumentResource; // TODO: hacky
