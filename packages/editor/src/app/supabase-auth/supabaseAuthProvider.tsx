import { Route } from "react-router-dom";

import { SupabaseSessionStore } from "./SupabaseSessionStore";
import { Login } from "./routes/Login";
import { Recover } from "./routes/Recover";
import { Register } from "./routes/Register";
import { Username } from "./routes/Username";

export const supabaseAuthProvider = {
  routes: {
    login: (sessionStore: SupabaseSessionStore) => (
      <Login sessionStore={sessionStore} />
    ),
    register: (sessionStore: SupabaseSessionStore) => (
      <Register sessionStore={sessionStore} />
    ),
    additionalRoutes: (sessionStore: SupabaseSessionStore) => (
      <>
        <Route
          path="/recover"
          element={<Recover sessionStore={sessionStore} />}
        />
        <Route
          path="/username"
          element={<Username sessionStore={sessionStore} />}
        />
      </>
    ),
  },
};
