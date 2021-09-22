import React from "react";
import ReactDOM from "react-dom";
import * as reo from "react-error-overlay";
import "@atlaskit/css-reset/dist/bundle.css";
import "./index.css";
import MatrixApp from "./MatrixApp";
import reportWebVitals from "./reportWebVitals";

import * as yjsBindings from "@reactivedata/yjs-reactive-bindings";
import * as mobx from "mobx";
import Frame from "./runtime/executor/executionHosts/sandboxed/iframesandbox/Frame";
import { MATRIX_CONFIG } from "./config/config";

if (process.env.NODE_ENV === "development") {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells
  // Note that this breaks hot reloading
  // (reo as any).stopReportingRuntimeErrors();
}

// const config = {
//   default_server_config: {
//     "m.homeserver": {
//       base_url: "https://matrix-client.matrix.org",
//       server_name: "matrix.org",
//     },
//     "m.identity_server": {
//       base_url: "https://vector.im",
//     },
//   },
// };
// const validatedConfig = await verifyServerConfig(config);

const cachedValidatedConfig = {
  hsName: MATRIX_CONFIG.hsName,
  hsNameIsDifferent: true,
  hsUrl: MATRIX_CONFIG.hsUrl,
  isDefault: true,
  isNameResolvable: true,
  isUrl: MATRIX_CONFIG.isUrl,
  warning: null,
};

async function init() {
  // TODO

  // await Olm.init({
  //   locateFile: () => olmWasmPath,
  // });
  if (window.location.search.includes("frame")) {
    ReactDOM.render(
      <React.StrictMode>
        <Frame />
      </React.StrictMode>,
      document.getElementById("root")
    );
  } else {
    yjsBindings.useMobxBindings(mobx);
    yjsBindings.makeYJSObservable();

    ReactDOM.render(
      <React.StrictMode>
        <MatrixApp config={cachedValidatedConfig} />
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
}

init();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// @ts-ignore - for React-based plugins
window.react = React;
// @ts-ignore - for React-based plugins
window.reactDOM = ReactDOM;
