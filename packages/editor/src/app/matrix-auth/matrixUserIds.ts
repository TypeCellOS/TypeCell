import { DEFAULT_HOMESERVER_HOST } from "../../config/config";

export function getUserFromMatrixId(matrixId: string) {
  // @username:hostname:port (port is optional)
  const parts = matrixId.match(/^(@[a-z0-9-_]+):([a-z\-.]+(:\d+)?)$/);
  if (!parts) {
    throw new Error("invalid user id");
  }
  const user = parts[1]; // TODO: what to do with host for federation?
  if (!user.startsWith("@") || user.length < 2) {
    throw new Error("invalid user id");
  }

  return {
    localUserId: parts[1],
    host: parts[2],
  };
}

export function friendlyUserId(matrixId: string) {
  const parsed = getUserFromMatrixId(matrixId);
  if (parsed.host === DEFAULT_HOMESERVER_HOST) {
    return parsed.localUserId;
  }
  return matrixId;
}
