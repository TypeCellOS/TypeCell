import "@atlaskit/css-reset/dist/bundle.css";
import React from "react";
import ReactDOM from "react-dom";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as reo from "react-error-overlay";
import { validateFrameDomain } from "./config/security";
import "./iframe.css";
import Frame from "./runtime/executor/executionHosts/sandboxed/iframesandbox/Frame";

if (process.env.NODE_ENV === "development") {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells
  // Note that this breaks hot reloading
  (reo as any).stopReportingRuntimeErrors();
}

console.log("Loading iframe", window.location.href);

async function init() {
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
}

init();
