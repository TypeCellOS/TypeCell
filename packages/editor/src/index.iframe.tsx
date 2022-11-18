import "@atlaskit/css-reset/dist/bundle.css";
import React from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createRoot } from "react-dom/client";
import * as reo from "react-error-overlay";
import {
  getMainDomainFromIframe,
  validateFrameDomain,
} from "./config/security";
import "./iframe.css";
import Frame from "./runtime/executor/executionHosts/sandboxed/iframesandbox/Frame";

if (import.meta.env.DEV) {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells
  // Note that this breaks hot reloading
  try {
    (reo as any).stopReportingRuntimeErrors();
  } catch (e) {
    console.error(e);
  }
}

console.log("Loading iframe", window.location.href);

// make sure links open in new window instead of iframe
const base = document.createElement("base");
base.setAttribute("href", "//" + getMainDomainFromIframe());
base.setAttribute("target", "_blank");
document.head.appendChild(base);

async function init() {
  // TODO: prevent monaco from loading in frame
  if (!validateFrameDomain()) {
    throw new Error("invalid hostname for frame");
  }
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <Frame />
    </React.StrictMode>
  );
}

init();
