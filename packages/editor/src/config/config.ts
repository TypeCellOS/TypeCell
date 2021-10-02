export const DEFAULT_HOMESERVER_HOST = "mx.typecell.org";

export const MATRIX_CONFIG = {
  hsName: "typecell.org",
  hsUrl: "https://" + DEFAULT_HOMESERVER_HOST,
  isUrl: "https://vector.im",
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
