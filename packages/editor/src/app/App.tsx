import { observer } from "mobx-react-lite";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { getStoreService } from "../store/local/stores";
import { StartScreen } from "./main/components/startscreen/StartScreen";
import Main from "./main/Main";
import { ValidatedServerConfig } from "./matrix-auth/auth/util/AutoDiscoveryUtils";
import { DocumentRoute } from "./routes/document";
import { DynamicRoute } from "./routes/dynamic";
import { Login } from "./routes/login";
import { ProfileRoute } from "./routes/profile";
import { Register } from "./routes/register";

export const App = observer((props: { config: ValidatedServerConfig }) => {
  console.log("app render");
  const { sessionStore } = getStoreService();
  if (sessionStore.user === "loading") {
    return <div>Loading</div>;
  } else if (sessionStore.user === "offlineNoUser") {
    return <div>Offline</div>;
  } else {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />}>
            <Route path="@:userParam" element={<ProfileRoute />}></Route>
            <Route
              path="@:userParam/:documentParam"
              element={<DocumentRoute />}></Route>
            <Route index element={<StartScreen></StartScreen>}></Route>
            <Route path="*" element={<DynamicRoute />} />
          </Route>
          <Route
            path="/register"
            element={<Register config={props.config} />}
          />
          <Route path="/recover" element={<div>Not implemented yet</div>} />
          <Route path="/login" element={<Login config={props.config} />} />
          {/* todo: notfound?  */}
        </Routes>
      </BrowserRouter>
    );
  }
});
export default App;

//   // Before we continue, let's see if we're supposed to do an SSO redirect
//   const [userId] = await Lifecycle.getStoredSessionOwner();
//   const hasPossibleToken = !!userId;
//   const isReturningFromSso = !!params.loginToken;
//   const autoRedirect = config["sso_immediate_redirect"] === true;
//   if (!hasPossibleToken && !isReturningFromSso && autoRedirect) {
//     console.log("Bypassing app load to redirect to SSO");
//     const tempCli = createClient({
//       baseUrl: config["validated_server_config"].hsUrl,
//       idBaseUrl: config["validated_server_config"].isUrl,
//     });
//     PlatformPeg.get().startSingleSignOn(
//       tempCli,
//       "sso",
//       `/${getScreenFromLocation(window.location).screen}`
//     );

//     // We return here because startSingleSignOn() will asynchronously redirect us. We don't
//     // care to wait for it, and don't want to show any UI while we wait (not even half a welcome
//     // page). As such, just don't even bother loading the MatrixChat component.
//     return;
//   }
