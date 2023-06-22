// /// <reference types="vite/client" />

// interface ImportMetaEnv {
//   readonly VITE_ENVIRONMENT: "PROD" | "DEV" | "STAGING";
//   readonly VITE_TYPECELL_SUPABASE_URL: string;
//   readonly VITE_TYPECELL_SUPABASE_ANON_KEY: string;
//   readonly VITE_TYPECELL_SUPABASE_SERVICE_KEY: string;
//   readonly PORT: string;
//   // more env variables...
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly ENVIRONMENT: "PROD" | "DEV" | "STAGING";
      readonly TYPECELL_SUPABASE_URL: string;
      readonly TYPECELL_SUPABASE_ANON_KEY: string;
      readonly TYPECELL_SUPABASE_SERVICE_KEY: string;
      readonly PORT: string;
    }
  }
}

export {};
