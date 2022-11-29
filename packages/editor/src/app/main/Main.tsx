import { observer } from "mobx-react-lite";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DocumentResource } from "../../store/DocumentResource";
import { getStoreService } from "../../store/local/stores";
import { CloseNewPageDialog, IsNewPageDialogOpen } from "../routes/routes";
import { Navigation } from "./components/Navigation";
import NewPageDialog from "./components/NewPageDialog";
import styles from "./Main.module.css";

const Main = observer((props: {}) => {
  const sessionStore = getStoreService().sessionStore;

  let location = useLocation();
  let navigate = useNavigate();

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={
          styles.main + " " + (location.pathname === "/" ? styles.homepage : "")
        }>
        <Navigation />
        <Outlet />
        {sessionStore.loggedInUserId && (
          <NewPageDialog
            ownerId={sessionStore.loggedInUserId}
            close={() => CloseNewPageDialog(navigate)}
            isOpen={IsNewPageDialogOpen(location)}
          />
        )}
      </div>
    </DndProvider>
  );
});

export default Main;

(window as any).DocumentResource = DocumentResource; // TODO: hacky
