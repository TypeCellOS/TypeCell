import { Route } from "react-router-dom";
import { cachedValidatedConfig } from "./matrixConfig";
import { Login } from "./routes/login";
import { Register } from "./routes/register";

export const matrixAuthProvider = {
  routes: {
    login: () => <Login config={cachedValidatedConfig} />,
    register: () => <Register config={cachedValidatedConfig} />,
    additionalRoutes: (
      <Route path="/recover" element={<div>Not implemented yet</div>} />
    ),
  },
};
