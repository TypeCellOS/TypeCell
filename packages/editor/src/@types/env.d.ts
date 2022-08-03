/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly PUBLIC_URL: string;
  readonly REACT_APP_STAGING: string;
  readonly REACT_APP_HOMESERVER_URI: string;
  readonly REACT_APP_HOMESERVER_NAME: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
