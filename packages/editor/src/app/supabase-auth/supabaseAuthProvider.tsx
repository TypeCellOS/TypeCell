import { Route } from "react-router-dom";

import { Login } from "./routes/Login";
import { Register } from "./routes/Register";
import { Username } from "./routes/Username";
import { SupabaseSessionStore } from "./SupabaseSessionStore";

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
        <Route path="/recover" element={<div>Not implemented yet</div>} />
        <Route
          path="/username"
          element={<Username sessionStore={sessionStore} />}
        />
      </>
    ),
  },
};
