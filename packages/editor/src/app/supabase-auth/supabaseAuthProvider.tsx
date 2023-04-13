import { Route } from "react-router-dom";

import { Login } from "./routes/Login";
import { Register } from "./routes/Register";
import { Username } from "./routes/Username";

export const supabaseAuthProvider = {
  routes: {
    login: () => <Login />,
    register: () => <Register />,
    additionalRoutes: (
      <>
        <Route path="/recover" element={<div>Not implemented yet</div>} />
        <Route path="/username" element={<Username />} />
      </>
    ),
  },
};
