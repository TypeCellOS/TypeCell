import { DEFAULT_HOMESERVER_HOST } from "../../../../config/config";

export type User = {
  // avatarUrl: any,
  id: string;
  name: string;
  // type: "user" | "team" | "email" | "group",
  // fixed: boolean,
  // lozenge: string
};

export function parseMatrixUserId(userId: string) {
  const parts = userId.split(":", 2);
  if (parts.length !== 2) {
    throw new Error("unexpected user id");
  }
  return {
    localUserId: parts[0],
    host: parts[1],
  };
}

export function friendlyUserId(userId: string) {
  const parsed = parseMatrixUserId(userId);
  if (parsed.host === DEFAULT_HOMESERVER_HOST) {
    return parsed.localUserId;
  }
  return userId;
}
