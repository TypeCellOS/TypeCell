/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly VITE_REACT_APP_STAGING: string;
  readonly VITE_REACT_APP_HOMESERVER_URI: string;
  readonly VITE_REACT_APP_HOMESERVER_NAME: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
