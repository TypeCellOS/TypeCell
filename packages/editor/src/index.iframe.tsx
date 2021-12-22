import React from "react";
import ReactDOM from "react-dom";
import { validateFrameDomain } from "./config/security";
import Frame from "./runtime/executor/executionHosts/sandboxed/iframesandbox/Frame";
import "./iframe.css";

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
