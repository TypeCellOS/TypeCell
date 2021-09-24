import { observer } from "mobx-react-lite";
import React from "react";
import { getStoreService } from "../store/local/stores";
import Main from "./main/Main";
import LoginComponent from "./matrix-auth/auth/Login";
import Registration from "./matrix-auth/auth/Registration";
import { ValidatedServerConfig } from "./matrix-auth/auth/util/AutoDiscoveryUtils";


function makeRegistrationUrl(params: any) {
  let url =
    window.location.protocol + "//" + window.location.host + "/register";

  const keys = Object.keys(params);
  for (let i = 0; i < keys.length; ++i) {
    if (i === 0) {
      url += "?";
    } else {
      url += "&";
    }
    const k = keys[i];
    url += k + "=" + encodeURIComponent(params[k]);
  }
  return url;
}

export const App = observer(
  (props: { config: ValidatedServerConfig }) => {
    const { sessionStore, matrixAuthStore, navigationStore } = getStoreService();
    if (sessionStore.user === "loading") {
      return <div>Loading</div>;
    } else if (navigationStore.currentPage.page === "login") {
      return (
        <LoginComponent
          serverConfig={props.config}
          onLoggedIn={matrixAuthStore.onUserCompletedLoginFlow}
          onRegisterClick={() => {
            navigationStore.showRegisterScreen();
          }}
          onServerConfigChange={() => {
            // TODO
            console.log("config change (not implemented)");
          }}
          onForgotPasswordClick={() => navigationStore.showForgotPassword()}
        />
      );
    } else if (navigationStore.currentPage.page === "register") {
      // const email = ThreepidInviteStore.instance.pickBestInvite()?.toEmail;
      return (
        <Registration
          // clientSecret={this.state.register_client_secret}
          // sessionId={this.state.register_session_id}
          // idSid={this.state.register_id_sid}
          email={undefined}
          brand={"TypeCell"}
          makeRegistrationUrl={makeRegistrationUrl}
          onLoggedIn={matrixAuthStore.onUserCompletedLoginFlow}
          onLoginClick={() => {
            navigationStore.showLoginScreen();
          }}
          onServerConfigChange={() => {
            // TODO
            console.log("config change (not implemented)");
          }}
          defaultDeviceDisplayName={"TypeCell web"}
          // fragmentAfterLogin={fragmentAfterLogin}
          serverConfig={props.config}
        />
      );
    } else if (navigationStore.currentPage.page === "recover") {
      return <div>Not implemented yet</div>;
    } else {
      return <Main currentPage={navigationStore.currentPage} />;
    }
  }
);
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