import { observer } from "mobx-react-lite";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getStoreService } from "../../../store/local/stores";
import { ValidatedServerConfig } from "../../matrix-auth/auth/util/AutoDiscoveryUtils";
import { toRecoverPasswordScreen, toRegisterScreen } from "../../routes/routes";
import { MatrixSessionStore } from "../MatrixSessionStore";
import LoginComponent from "../auth/Login";

export const Login = observer((props: { config: ValidatedServerConfig }) => {
  const { sessionStore } = getStoreService();
  if (!(sessionStore instanceof MatrixSessionStore)) {
    throw new Error("sessionStore is not a MatrixSessionStore");
  }
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
      onLoggedIn={sessionStore.matrixAuthStore.onUserCompletedLoginFlow}
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
