import { uri } from "vscode-lib";
import { env } from "./env";

export const DEFAULT_PROVIDER: "matrix" | "supabase" = "supabase";

export const DEFAULT_HOMESERVER_URI = uri.URI.parse(
  env.VITE_MATRIX_HOMESERVER_URI
);

export const DEFAULT_IDENTIFIER_BASE =
  (DEFAULT_PROVIDER as string) === "matrix"
    ? uri.URI.from({
        scheme: "mx",
        authority: DEFAULT_HOMESERVER_URI.authority,
        path: "/",
      })
    : uri.URI.from({
        scheme: "typecell",
        authority: "typecell.org",
        path: "/",
      });

export const DEFAULT_IDENTIFIER_BASE_STRING =
  DEFAULT_IDENTIFIER_BASE.toString().replace("://", ":");

export const MATRIX_CONFIG = {
  hsName: env.VITE_MATRIX_HOMESERVER_NAME,
  hsUrl: DEFAULT_HOMESERVER_URI.toString(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isUrl: undefined as any, // "https://vector.im",
  defaultDeviceDisplayName: "TypeCell web",
};

// export const DEFAULT_HOMESERVER_HOST = "matrix-client.matrix.org";

// export const MATRIX_CONFIG = {
//   hsName: "matrix.org",
//   hsUrl: "https://" + DEFAULT_HOMESERVER_HOST,
//   isUrl: "https://vector.im",
// };

export function getTestFlags(): {
  disableWebRTC?: boolean;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__TEST_OPTIONS || {};
}
