import { observer } from "mobx-react-lite";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getStoreService } from "../../store/local/stores";
import LoginComponent from "../matrix-auth/auth/Login";
import { ValidatedServerConfig } from "../matrix-auth/auth/util/AutoDiscoveryUtils";
import { toRecoverPasswordScreen, toRegisterScreen } from "./routes";

export const Login = observer((props: { config: ValidatedServerConfig }) => {
  const { matrixAuthStore, sessionStore } = getStoreService();

  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state as any)?.from?.pathname || "/";
  let pageAfterLogin = window.location.origin + from;

  if (sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  return (
    <LoginComponent
      serverConfig={props.config}
      onLoggedIn={matrixAuthStore.onUserCompletedLoginFlow}
      onRegisterClick={() => {
        navigate(toRegisterScreen(), {
          state: { from: (location.state as any)?.from },
        });
      }}
      onServerConfigChange={() => {
        // TODO
        console.log("config change (not implemented)");
      }}
      // TODO: does this work correctly after SSO login is declined?
      pageAfterLogin={pageAfterLogin}
      onForgotPasswordClick={() => navigate(toRecoverPasswordScreen())}
    />
  );
});
