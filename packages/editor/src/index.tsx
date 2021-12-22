import React from "react";
import ReactDOM from "react-dom";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as reo from "react-error-overlay";

import reportWebVitals from "./reportWebVitals";

if (process.env.NODE_ENV === "development") {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells
  // Note that this breaks hot reloading
  (reo as any).stopReportingRuntimeErrors();
}

console.log("Loading", window.location.href);

async function init() {
  // TODO: separate code from iframe and parent window?

  if (window.location.search.includes("frame")) {
    await import("./index.iframe");
  } else {
    await import("./index.host");
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
