import "@atlaskit/css-reset/dist/bundle.css";
import "./index.css";
// @ts-ignore
import olmWasmPath from "@matrix-org/olm/olm.wasm";
import * as yjsBindings from "@syncedstore/yjs-reactive-bindings";
import * as mobx from "mobx";
import React from "react";
import ReactDOM from "react-dom";
import App from "./app/App";
import { MATRIX_CONFIG } from "./config/config";
import { validateHostDomain } from "./config/security";
import { setMonacoDefaults } from "./runtime/editor";
import setupNpmTypeResolver from "./runtime/editor/languages/typescript/npmTypeResolver";
import setupTypecellTypeResolver from "./runtime/editor/languages/typescript/typecellTypeResolver";
import { MonacoContext } from "./runtime/editor/MonacoContext";
import { initializeStoreService } from "./store/local/stores";
import * as monaco from "monaco-editor";
import * as Olm from "@matrix-org/olm";
import { BrowserRouter, Route } from "react-router-dom";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as reo from "react-error-overlay";
import { Register } from "./app/routes/register";
import { Login } from "./app/routes/login";

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

console.log("Loading host", window.location.href);

async function init() {
  if (!validateHostDomain()) {
    throw new Error("invalid hostname for host");
  }
  // TODO: separate code from iframe and parent window?

  // const [Olm, monaco] = await Promise.all([
  //   import("@matrix-org/olm"),
  //   undefined as any, //import("monaco-editor"),
  // ]);
  await Olm.init({
    locateFile: () => olmWasmPath,
  });

  yjsBindings.enableMobxBindings(mobx);

  initializeStoreService();
  setMonacoDefaults(monaco);
  setupTypecellTypeResolver(monaco);
  setupNpmTypeResolver(monaco);

  ReactDOM.render(
    <React.StrictMode>
      <MonacoContext.Provider value={{ monaco }}>
        <App config={cachedValidatedConfig} />
      </MonacoContext.Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );
}

init();
