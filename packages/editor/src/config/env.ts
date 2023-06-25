// We need to define the defaults for the dev env here,
// because playwright-test doesn't seem to support .env files
// (https://github.com/hugomrdias/playwright-test/issues/549)
// NOTE: keep in sync with .env.development
const devDefaults = {
  VITE_ENVIRONMENT: "development",
  VITE_TYPECELL_BACKEND_WS_URL: "ws://localhost:1234",
  VITE_TYPECELL_SUPABASE_URL: "http://localhost:54321",
  VITE_TYPECELL_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  VITE_MATRIX_HOMESERVER_URI: "https://mx.typecell.org",
  VITE_MATRIX_HOMESERVER_NAME: "typecell.org",
};

const passedInEnv = {
  VITE_ENVIRONMENT: import.meta.env?.VITE_ENVIRONMENT,
  VITE_TYPECELL_BACKEND_WS_URL: import.meta.env?.VITE_TYPECELL_BACKEND_WS_URL,
  VITE_TYPECELL_SUPABASE_URL: import.meta.env?.VITE_TYPECELL_SUPABASE_URL,
  VITE_TYPECELL_SUPABASE_ANON_KEY: import.meta.env
    ?.VITE_TYPECELL_SUPABASE_ANON_KEY,
  VITE_MATRIX_HOMESERVER_URI: import.meta.env?.VITE_MATRIX_HOMESERVER_URI,
  VITE_MATRIX_HOMESERVER_NAME: import.meta.env?.VITE_MATRIX_HOMESERVER_NAME,
};

export const env = import.meta.env?.VITE_ENVIRONMENT
  ? passedInEnv
  : devDefaults;
