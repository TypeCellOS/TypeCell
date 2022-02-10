import { uri } from "vscode-lib";

const HOMESERVER_URI = uri.URI.parse(
  process.env.REACT_APP_HOMESERVER_URI || "https://mx.typecell.org"
);

export const DEFAULT_HOMESERVER_HOST = HOMESERVER_URI.authority;

export const MATRIX_CONFIG = {
  hsName: process.env.REACT_APP_HOMESERVER_NAME || "typecell.org",
  hsUrl: HOMESERVER_URI.toString(),
  isUrl: undefined as any, // "https://vector.im",
  defaultDeviceDisplayName: "TypeCell web",
};

export const ENVIRONMENT: "PROD" | "DEV" | "STAGING" =
  process.env.REACT_APP_STAGING === "true"
    ? "STAGING"
    : process.env.NODE_ENV === "production"
    ? "PROD"
    : "DEV";
// export const DEFAULT_HOMESERVER_HOST = "matrix-client.matrix.org";

// export const MATRIX_CONFIG = {
//   hsName: "matrix.org",
//   hsUrl: "https://" + DEFAULT_HOMESERVER_HOST,
//   isUrl: "https://vector.im",
// };

export function getTestFlags(): {
  disableWebRTC?: boolean;
} {
  return (window as any).__TEST_OPTIONS || {};
}
