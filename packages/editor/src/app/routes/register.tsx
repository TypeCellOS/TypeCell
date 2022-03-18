import { observer } from "mobx-react-lite";
import qs from "qs";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { MATRIX_CONFIG } from "../../config/config";
import { getStoreService } from "../../store/local/stores";
import Registration from "../matrix-auth/auth/Registration";
import { ValidatedServerConfig } from "../matrix-auth/auth/util/AutoDiscoveryUtils";
import { toLoginScreen } from "./routes";

function makeRegistrationUrl(params: any) {
  let url =
    window.location.protocol + "//" + window.location.host + "/register";

  let keys = Object.keys(params);

  // if any of the params (in our case, is_url) is undefined, don't include it in url
  keys = keys.filter((key) => params[key] !== undefined);

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

export const Register = observer((props: { config: ValidatedServerConfig }) => {
  const { matrixAuthStore, sessionStore } = getStoreService();
  const navigate = useNavigate();
  const location = useLocation();
  const params = qs.parse(window.location.search);

  if (params.hs_url && params.hs_url !== MATRIX_CONFIG.hsUrl) {
    throw new Error("different homeserver not supported");
  }

  if (params.is_url && params.is_url !== MATRIX_CONFIG.isUrl) {
    throw new Error("different identity server not supported");
  }

  const from = (location.state as any)?.from?.pathname || "/";
  let pageAfterLogin = window.location.origin + from;

  if (sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  // const email = ThreepidInviteStore.instance.pickBestInvite()?.toEmail;
  return (
    <Registration
      clientSecret={params.client_secret as string | undefined}
      sessionId={params.session_id as string | undefined}
      idSid={params.sid as string | undefined}
      email={undefined}
      brand={"TypeCell"}
      makeRegistrationUrl={makeRegistrationUrl}
      onLoggedIn={matrixAuthStore.onUserCompletedLoginFlow}
      onLoginClick={() => {
        navigate(toLoginScreen(), {
          state: { from: (location.state as any)?.from },
        });
      }}
      onServerConfigChange={() => {
        // TODO
        console.log("config change (not implemented)");
      }}
      defaultDeviceDisplayName={"TypeCell web"}
      // TODO: does this work correctly after SSO login is declined?
      pageAfterLogin={pageAfterLogin}
      serverConfig={props.config}
    />
  );
});
