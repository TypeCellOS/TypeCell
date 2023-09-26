import { observer } from "mobx-react-lite";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";
import { SessionStore } from "../../../store/local/SessionStore";
import { Logo } from "../../main/components/Logo";

import { useEffect } from "react";
import { SupabaseSessionStore } from "../SupabaseSessionStore";
import AuthStyles from "./AuthStyles.module.css";

export const Recover = observer((props: { sessionStore: SessionStore }) => {
  const { sessionStore } = props;

  const location = useLocation();
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = (location.state as any)?.from?.pathname || "/";
  //   let pageAfterLogin = window.location.origin + from;

  if (!sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  useEffect(() => {
    const { data: authListener } = (
      sessionStore as SupabaseSessionStore
    ).supabase.auth.onAuthStateChange((event) => {
      if (event === "USER_UPDATED") {
        // bit hacky, but otherwise supabase auth ui just displays a login screen and there's no way to excape.
        // navigate to main page instead
        navigate(from, { replace: true });
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [from, navigate, sessionStore]);

  const redirectTo = from;

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
            supabaseClient={(sessionStore as SupabaseSessionStore).supabase}
            view="update_password"
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
