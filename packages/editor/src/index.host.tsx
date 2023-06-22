import * as yjsBindings from "@syncedstore/yjs-reactive-bindings";
import { Buffer } from "buffer";
import * as mobx from "mobx";
import * as monaco from "monaco-editor";
import * as process from "process";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { matrixAuthProvider } from "./app/matrix-auth/MatrixAuthProvider";
import { SupabaseSessionStore } from "./app/supabase-auth/SupabaseSessionStore";
import { supabaseAuthProvider } from "./app/supabase-auth/supabaseAuthProvider";
import { DEFAULT_PROVIDER } from "./config/config";
import { validateHostDomain, validateSupabaseConfig } from "./config/security";
import { setMonacoDefaults } from "./runtime/editor";
import { MonacoContext } from "./runtime/editor/MonacoContext";
import setupNpmTypeResolver from "./runtime/editor/languages/typescript/npmTypeResolver";
import setupTypecellTypeResolver from "./runtime/editor/languages/typescript/typecellTypeResolver";
import { SessionStore } from "./store/local/SessionStore";
import "./styles/index.css";

// polyfills (mostly required for matrix-crdt)
(window as any).Buffer = Buffer;
(window as any).process = process;

if (import.meta.env.DEV) {
  // disables error overlays
  // We make use of React Error Boundaries to catch exceptions during rendering of
  // user-defined react components. It's annoying (and slow) to get the React error overlay
  // while editing TypeCell cells
  // Note that this breaks hot reloading
  // (reo as any).stopReportingRuntimeErrors();
}

console.log("Loading host", window.location.href);

async function init() {
  if (!validateHostDomain()) {
    throw new Error("invalid hostname for host");
  }

  if (!validateSupabaseConfig()) {
    throw new Error("accessing prod db on non-prod");
  }

  yjsBindings.enableMobxBindings(mobx);

  setMonacoDefaults(monaco);
  setupTypecellTypeResolver(monaco);
  setupNpmTypeResolver(monaco);

  const root = createRoot(document.getElementById("root")!);

  const authProvider =
    DEFAULT_PROVIDER === "matrix" ? matrixAuthProvider : supabaseAuthProvider;

  const sessionStore: SessionStore =
    DEFAULT_PROVIDER === "matrix"
      ? new SupabaseSessionStore() //new MatrixSessionStore(new MatrixAuthStore())
      : new SupabaseSessionStore();

  await sessionStore.initialize();

  root.render(
    // TODO: support strictmode
    // <React.StrictMode>
    <MonacoContext.Provider value={{ monaco }}>
      <App authProvider={authProvider} sessionStore={sessionStore} />
    </MonacoContext.Provider>
    // </React.StrictMode>
  );
}

init();
