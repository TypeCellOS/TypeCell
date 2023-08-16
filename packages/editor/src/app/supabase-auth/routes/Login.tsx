import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";

import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";
import { createClient } from "@supabase/supabase-js";
import { SessionStore } from "../../../store/local/SessionStore";
import { Logo } from "../../main/components/Logo";

import { env } from "../../../config/env";
import AuthStyles from "./AuthStyles.module.css";

const supabase = createClient(
  env.VITE_TYPECELL_SUPABASE_URL,
  env.VITE_TYPECELL_SUPABASE_ANON_KEY
);

export const Login = observer((props: { sessionStore: SessionStore }) => {
  const { sessionStore } = props;

  const location = useLocation();
  //   const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from?.pathname || "/";
  //   let pageAfterLogin = window.location.origin + from;

  if (sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  const redirectTo = window.location.origin + "/login";

  return (
    <div className={AuthStyles.AuthPage}>
      <div className={AuthStyles.AuthHeader}>
        <div className={AuthStyles.AuthHeaderLogo}>
          <Logo></Logo>
        </div>
      </div>
      <div className={AuthStyles.AuthBody}>
        <div className={AuthStyles.AuthForm}>
          <Auth
            magicLink={true}
            supabaseClient={supabase}
            view="sign_in"
            appearance={{ theme: ThemeSupa }}
            redirectTo={redirectTo}
            providers={["google", "github"]}
          />
          {/* <div className={AuthStyles.AuthFormFooter}>sdfsdf</div> */}
        </div>
      </div>
      <div className={AuthStyles.AuthFooter}>
        {/* <HelperMessage>Powered by Matrix</HelperMessage> */}
      </div>
    </div>
  );
});
