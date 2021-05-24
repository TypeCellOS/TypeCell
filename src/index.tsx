import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as reo from "react-error-overlay";
import MatrixApp from "./MatrixApp";
import { verifyServerConfig } from "./matrix/auth/util/verifyServerConfig";

if (process.env.NODE_ENV === "development") {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells

  // Note that this breaks hot reloading
  (reo as any).stopReportingRuntimeErrors();
}

const config = {
  default_server_config: {
    "m.homeserver": {
      base_url: "https://matrix-client.matrix.org",
      server_name: "matrix.org",
    },
    "m.identity_server": {
      base_url: "https://vector.im",
    },
  },
};

verifyServerConfig(config).then((val: any) => {
  ReactDOM.render(
    <React.StrictMode>
      <MatrixApp config={val} />
    </React.StrictMode>,
    document.getElementById("root")
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// @ts-ignore - for React-based plugins
window.react = React;
// @ts-ignore - for React-based plugins
window.reactDOM = ReactDOM;
