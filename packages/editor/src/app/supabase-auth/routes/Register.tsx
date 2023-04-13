import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";

import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";
import { createClient } from "@supabase/supabase-js";
import { getStoreService } from "../../../store/local/stores";
import { ANON_KEY } from "../supabaseConfig";

const supabase = createClient("http://localhost:54321", ANON_KEY);

export const Register = observer((props: {}) => {
  const { sessionStore } = getStoreService();

  const location = useLocation();
  //   const navigate = useNavigate();

  const from = (location.state as any)?.from?.pathname || "/";
  //   let pageAfterLogin = window.location.origin + from;

  if (sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      <Auth
        supabaseClient={supabase}
        view="sign_up"
        appearance={{ theme: ThemeSupa }}
      />
    </div>
  );
});
