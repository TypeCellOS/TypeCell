import { observer } from "mobx-react-lite";
import {
  BrowserRouter,
  NavigateFunction,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { getStoreService, initializeStoreService } from "../store/local/stores";
import Main from "./main/Main";
import { AILanding } from "./main/components/startscreen/AILanding";
import { StartScreen } from "./main/components/startscreen/StartScreen";
import { matrixAuthProvider } from "./matrix-auth/MatrixAuthProvider";
import { DocumentRoute } from "./routes/document";
import { DynamicRoute } from "./routes/dynamic";
import { ProfileRoute } from "./routes/profile";

export let navigateRef: NavigateFunction | undefined;

const Wrapper = observer(() => {
  const navigate = useNavigate();

  if (!navigateRef) {
    navigateRef = navigate;
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
              <Route path="@:userParam" element={<ProfileRoute />}></Route>
              <Route
                path="@:userParam/:documentParam"
                element={<DocumentRoute />}></Route>
              <Route index element={<StartScreen></StartScreen>}></Route>
              <Route path="/ai" element={<AILanding />} />
              <Route path="*" element={<DynamicRoute />} />
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
