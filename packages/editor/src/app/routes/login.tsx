import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { getStoreService } from "../../store/local/stores";
import LoginComponent from "../matrix-auth/auth/Login";
import { ValidatedServerConfig } from "../matrix-auth/auth/util/AutoDiscoveryUtils";
import { toRecoverPasswordScreen, toRegisterScreen } from "./routes";

export const Login = observer((props: { config: ValidatedServerConfig }) => {
  const { matrixAuthStore } = getStoreService();
  const navigate = useNavigate();
  let pageAfterLogin = window.history.state?.prevUrl || "";

  return (
    <LoginComponent
      serverConfig={props.config}
      onLoggedIn={matrixAuthStore.onUserCompletedLoginFlow}
      onRegisterClick={() => {
        navigate(toRegisterScreen());
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
