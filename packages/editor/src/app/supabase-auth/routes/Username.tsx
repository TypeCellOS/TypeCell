import { observer } from "mobx-react-lite";
import { Navigate, useLocation } from "react-router-dom";

import React from "react";
import { getStoreService } from "../../../store/local/stores";
import { SupabaseSessionStore } from "../SupabaseSessionStore";

export const Username = observer((props: {}) => {
  const { sessionStore } = getStoreService();

  if (!(sessionStore instanceof SupabaseSessionStore)) {
    throw new Error("sessionStore is not a SupabaseSessionStore");
  }

  const usernameRef = React.useRef<HTMLInputElement>(null);

  const location = useLocation();
  //   const navigate = useNavigate();

  const setUsername = async () => {
    const username = usernameRef.current?.value;
    if (username) {
      await sessionStore.setUsername(username);
    }
  };

  const from = (location.state as any)?.from?.pathname || "/";
  //   let pageAfterLogin = window.location.origin + from;

  if (sessionStore.isLoggedIn) {
    return <Navigate to={from} replace={true} />;
  }

  // create a react view that prompts for a username
  return (
    <div style={{ maxWidth: "600px" }}>
      <input type="text" ref={usernameRef} />
      <input type="submit" onClick={setUsername} />
    </div>
  );
});
