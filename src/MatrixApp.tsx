import UAParser from "ua-parser-js";

import * as sdk from "matrix-js-sdk";
import React from "react";
import LoginComponent from "./matrix/auth/Login";
import { ValidatedServerConfig } from "./matrix/auth/util/AutoDiscoveryUtils";
import { navigationStore } from "./store/local/navigationStore";
import Host from "./host/Host";
import { observer } from "mobx-react-lite";
import { authStore } from "./matrix/AuthStore";

export const MatrixApp = observer(
  (props: { config: ValidatedServerConfig }) => {
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
              console.log("config change");
            }}
          />
          {/* <button onClick={sendMessage}>click</button> */}
        </div>
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
