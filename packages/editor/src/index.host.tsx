import * as yjsBindings from "@syncedstore/yjs-reactive-bindings";
import * as mobx from "mobx";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { SupabaseSessionStore } from "./app/supabase-auth/SupabaseSessionStore";
import { supabaseAuthProvider } from "./app/supabase-auth/supabaseAuthProvider";
import { DEFAULT_PROVIDER } from "./config/config";
import { env } from "./config/env";
import { validateHostDomain, validateSupabaseConfig } from "./config/security";

import { SessionStore } from "./store/local/SessionStore";
import "./styles/index.css";

// // polyfills (mostly required for matrix-crdt)
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).Buffer = Buffer;
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// (window as any).process = process;

if (env.VITE_ENVIRONMENT === "development") {
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const root = createRoot(document.getElementById("root")!);

  const authProvider = supabaseAuthProvider;

  const sessionStore: SessionStore =
    DEFAULT_PROVIDER === "matrix"
      ? new SupabaseSessionStore() //new MatrixSessionStore(new MatrixAuthStore())
      : new SupabaseSessionStore();

  await sessionStore.initialize();

  root.render(
    //<React.StrictMode>
    <App authProvider={authProvider} sessionStore={sessionStore} />
    //</React.StrictMode>
  );
}

init();
