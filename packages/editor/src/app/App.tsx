import { observer } from "mobx-react-lite";
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { SessionStore } from "../store/local/SessionStore";

import { navigateRef, setNavigateRef } from "./GlobalNavigateRef";
import Main from "./main/Main";
import { StartScreen } from "./main/components/startscreen/StartScreen";
import { DocumentRoute } from "./routes/document";
import { SupabaseSessionStore } from "./supabase-auth/SupabaseSessionStore";
import { supabaseAuthProvider } from "./supabase-auth/supabaseAuthProvider";

const Wrapper = observer((props: { sessionStore: SessionStore }) => {
  const navigate = useNavigate();

  if (!navigateRef.current) {
    setNavigateRef(navigate);
  }

  if (!props.sessionStore.isLoaded) {
    return <div>Loading</div>;
    // } else if (sessionStore.user === "offlineNoUser") {
    // return <div>Offline</div>;
  } else {
    return <Outlet />;
  }
});

export const App = observer(
  (props: {
    authProvider: typeof supabaseAuthProvider;
    sessionStore: SessionStore;
  }) => {
    console.log("app render");
    const { sessionStore } = props;
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<Wrapper sessionStore={sessionStore} />}>
            <Route path="/" element={<Main sessionStore={sessionStore} />}>
              <Route
                index
                element={
                  <StartScreen sessionStore={sessionStore}></StartScreen>
                }></Route>
              <Route
                path="/home"
                element={
                  <StartScreen sessionStore={sessionStore}></StartScreen>
                }></Route>

              <Route
                path="*"
                element={<DocumentRoute sessionStore={sessionStore} />}
              />
            </Route>
            <Route
              path="/register"
              element={props.authProvider.routes.register(
                sessionStore as SupabaseSessionStore,
              )}
            />
            <Route path="/recover" element={<div>Not implemented yet</div>} />
            <Route
              path="/login"
              element={props.authProvider.routes.login(
                sessionStore as SupabaseSessionStore,
              )}
            />
            {props.authProvider.routes.additionalRoutes(
              sessionStore as SupabaseSessionStore,
            )}
            {/* todo: notfound?  */}
          </Route>
        </Routes>
      </BrowserRouter>
    );
  },
);
export default App;
