/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TYPECELL_SUPABASE_URL: string;
  readonly VITE_TYPECELL_SUPABASE_ANON_KEY: string;
  readonly VITE_TYPECELL_SUPABASE_SERVICE_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly ENVIRONMENT: "PROD" | "DEV" | "STAGING";
      VITE_TYPECELL_SUPABASE_URL: string;
      VITE_TYPECELL_SUPABASE_ANON_KEY: string;
      VITE_TYPECELL_SUPABASE_SERVICE_KEY: string;
      readonly PORT: string;
    }
  }
}

export {};
