import { observer } from "mobx-react-lite";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DocumentResource } from "../../store/DocumentResource";
import { SessionStore } from "../../store/local/SessionStore";
import { CloseNewPageDialog, IsNewPageDialogOpen } from "../routes/routes";
import styles from "./Main.module.css";
import { Navigation } from "./components/Navigation";
import NewPageDialog from "./components/NewPageDialog";

const Main = observer((props: { sessionStore: SessionStore }) => {
  let location = useLocation();
  let navigate = useNavigate();

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={
          styles.main +
          " " +
          (location.pathname === "/" || location.pathname === "/ai"
            ? styles.homepage
            : "") +
          " " +
          (location.pathname === "/ai" ? styles.ai : "")
        }>
        <Navigation sessionStore={props.sessionStore} />
        <Outlet />
        {props.sessionStore.loggedInUserId && (
          <NewPageDialog
            sessionStore={props.sessionStore}
            ownerId={props.sessionStore.loggedInUserId}
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
