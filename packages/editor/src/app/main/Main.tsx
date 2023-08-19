import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Outlet, useLocation } from "react-router-dom";
import { DocumentResource } from "../../store/DocumentResource";
import { SessionStore } from "../../store/local/SessionStore";
import styles from "./Main.module.css";
import { Navigation } from "./components/Navigation";

const Main = observer((props: { sessionStore: SessionStore }) => {
  const location = useLocation();
  // const navigate = useNavigate();

  const [top, setTop] = useState(true);

  const controlNavbar = useCallback(() => {
    if (typeof window !== "undefined") {
      if (window.scrollY > 0) {
        setTop(false);
      } else {
        setTop(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);

      // cleanup function
      return () => {
        window.removeEventListener("scroll", controlNavbar);
      };
    }
  }, [controlNavbar]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={
          (top ? styles.top : "") +
          " " +
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
        {/* {props.sessionStore.loggedInUserId && (
          <NewPageDialog
            sessionStore={props.sessionStore}
            ownerId={props.sessionStore.loggedInUserId}
            close={() => CloseNewPageDialog(navigate)}
            isOpen={IsNewPageDialogOpen(location)}
          />
        )} */}
      </div>
    </DndProvider>
  );
});

export default Main;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).DocumentResource = DocumentResource; // TODO: hacky
