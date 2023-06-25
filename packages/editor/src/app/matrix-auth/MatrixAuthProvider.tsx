import { Route } from "react-router-dom";
import { MatrixSessionStore } from "./MatrixSessionStore";
import { cachedValidatedConfig } from "./matrixConfig";
import { Login } from "./routes/login";
import { Register } from "./routes/register";

export const matrixAuthProvider = {
  routes: {
    login: (sessionStore: MatrixSessionStore) => (
      <Login config={cachedValidatedConfig} sessionStore={sessionStore} />
    ),
    register: (sessionStore: MatrixSessionStore) => (
      <Register config={cachedValidatedConfig} sessionStore={sessionStore} />
    ),
    additionalRoutes: (_sessionStore: MatrixSessionStore) => (
      <Route path="/recover" element={<div>Not implemented yet</div>} />
    ),
  },
};
