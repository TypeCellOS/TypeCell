import React from "react";
import ReactDOM from "react-dom";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as reo from "react-error-overlay";
import "@atlaskit/css-reset/dist/bundle.css";
import "./index.css";
import App from "./app/App";
import reportWebVitals from "./reportWebVitals";

import * as yjsBindings from "@syncedstore/yjs-reactive-bindings";
import * as mobx from "mobx";
import Frame from "./runtime/executor/executionHosts/sandboxed/iframesandbox/Frame";
import { MATRIX_CONFIG } from "./config/config";
import { setMonacoDefaults } from "./runtime/editor";
import setupNpmTypeResolver from "./runtime/editor/languages/typescript/npmTypeResolver";
import setupTypecellTypeResolver from "./runtime/editor/languages/typescript/typecellTypeResolver";
import { initializeStoreService } from "./store/local/stores";
import * as monaco from "monaco-editor";
import { validateFrameDomain, validateHostDomain } from "./config/security";
// @ts-ignore
import olmWasmPath from "@matrix-org/olm/olm.wasm";
import Olm from "@matrix-org/olm";

if (process.env.NODE_ENV === "development") {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells
  // Note that this breaks hot reloading
  (reo as any).stopReportingRuntimeErrors();
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

console.log("Loading", window.location.href);

async function init() {
  // TODO: separate code from iframe and parent window?

  if (window.location.search.includes("frame")) {
    // TODO: prevent monaco from loading in frame
    if (!validateFrameDomain()) {
      throw new Error("invalid hostname for frame");
    }
    ReactDOM.render(
      <React.StrictMode>
        <Frame />
      </React.StrictMode>,
      document.getElementById("root")
    );
  } else {
    await Olm.init({
      locateFile: () => olmWasmPath,
    });
    if (!validateHostDomain()) {
      throw new Error("invalid hostname for host");
    }
    yjsBindings.enableMobxBindings(mobx);

    initializeStoreService();
    setMonacoDefaults(monaco);
    setupTypecellTypeResolver(monaco);
    setupNpmTypeResolver(monaco);

    ReactDOM.render(
      <React.StrictMode>
        <App config={cachedValidatedConfig} />
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
