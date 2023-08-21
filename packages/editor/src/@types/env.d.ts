/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/info" />
interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT: "PROD" | "DEV" | "STAGING";
  readonly VITE_TYPECELL_BACKEND_WS_URL: string;
  readonly VITE_TYPECELL_SUPABASE_URL: string;
  readonly VITE_TYPECELL_SUPABASE_ANON_KEY: string;
  readonly VITE_MATRIX_HOMESERVER_URI: string;
  readonly VITE_MATRIX_HOMESERVER_NAME: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
