import { observer } from "mobx-react-lite";
import React from "react";
import Host from "./host/Host";
import LoginComponent from "./matrix/auth/Login";
import { ValidatedServerConfig } from "./matrix/auth/util/AutoDiscoveryUtils";
import { authStore } from "./matrix/AuthStore";
import { navigationStore } from "./store/local/navigationStore";

export const MatrixApp = observer(
  (props: { config: ValidatedServerConfig }) => {
    // TODO: register
    // TODO: view / edit as guest
    if (navigationStore.isLoginScreenVisible) {
      return (
        <div>
          <LoginComponent
            serverConfig={props.config}
            onLoggedIn={authStore.onUserCompletedLoginFlow}
            onRegisterClick={() => {
              console.log("register");
            }}
            onServerConfigChange={() => {
              // TODO
              console.log("config change");
            }}
          />
          {/* <button onClick={sendMessage}>click</button> */}
        </div>
      );
    } else {
      const email = ThreepidInviteStore.instance.pickBestInvite()?.toEmail;
      return (
          <Registration
              clientSecret={this.state.register_client_secret}
              sessionId={this.state.register_session_id}
              idSid={this.state.register_id_sid}
              email={email}
              brand={this.props.config.brand}
              makeRegistrationUrl={this.makeRegistrationUrl}
              onLoggedIn={this.onRegisterFlowComplete}
              onLoginClick={this.onLoginClick}
              onServerConfigChange={this.onServerConfigChange}
              defaultDeviceDisplayName={this.props.defaultDeviceDisplayName}
              fragmentAfterLogin={fragmentAfterLogin}
              {...this.getServerProperties()}
          />
      );
    } else {
      return <Host />;
    }
  }
);
export default MatrixApp;

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
