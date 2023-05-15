import { observer } from "mobx-react-lite";
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { getStoreService, initializeStoreService } from "../store/local/stores";
import { navigateRef, setNavigateRef } from "./GlobalNavigateRef";
import Main from "./main/Main";
import { AILanding } from "./main/components/startscreen/AILanding";
import { StartScreen } from "./main/components/startscreen/StartScreen";
import { matrixAuthProvider } from "./matrix-auth/MatrixAuthProvider";
import { DocumentRoute } from "./routes/document";
import { ProfileRoute } from "./routes/profile";

const Wrapper = observer(() => {
  const navigate = useNavigate();

  if (!navigateRef.current) {
    setNavigateRef(navigate);
    initializeStoreService();
  }
  const { sessionStore } = getStoreService();

  if (!sessionStore.isLoaded) {
    return <div>Loading</div>;
    // } else if (sessionStore.user === "offlineNoUser") {
    // return <div>Offline</div>;
  } else {
    return <Outlet />;
  }
});

export const App = observer(
  (props: { authProvider: typeof matrixAuthProvider }) => {
    console.log("app render");

    return (
      <BrowserRouter>
        <Routes>
          <Route element={<Wrapper />}>
            <Route path="/" element={<Main />}>
              <Route index element={<StartScreen></StartScreen>}></Route>
              <Route path="/ai" element={<AILanding />} />

              <Route path=":userParam" element={<ProfileRoute />}></Route>
              <Route
                path=":userParam/:workspaceParam"
                element={<DocumentRoute />}></Route>
              <Route
                path=":userParam/:workspaceParam/*"
                element={<DocumentRoute />}></Route>
              {/* <Route path="*" element={<DynamicRoute />} /> */}
            </Route>
            <Route
              path="/register"
              element={props.authProvider.routes.register()}
            />
            <Route path="/recover" element={<div>Not implemented yet</div>} />
            <Route path="/login" element={props.authProvider.routes.login()} />
            {props.authProvider.routes.additionalRoutes}
            {/* todo: notfound?  */}
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }
);
export default App;
