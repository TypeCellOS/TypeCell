import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// import "./index.css";

// TODO: we might want to remove the explicit React dependency in the template
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
