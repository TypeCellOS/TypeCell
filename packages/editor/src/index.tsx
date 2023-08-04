/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import ReactDOM from "react-dom";
import reportWebVitals from "./reportWebVitals";

(window as any).process = {
  env: {
    ANALYTICS_NEXT_MODERN_CONTEXT: 1, // https://bitbucket.org/atlassian/atlassian-frontend-mirror/src/master/analytics/analytics-next/src/components/AnalyticsContext/index.tsx
  },
};
(window as any).OLM_OPTIONS = {};
if (typeof (window as any).global === "undefined") {
  (window as any).global = window;
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - for React-based plugins
window.react = React;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - for React-based plugins
window.reactDOM = ReactDOM;
