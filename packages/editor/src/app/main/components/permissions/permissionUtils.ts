import { updateMatrixRoomAccess } from "matrix-crdt";

export type DocPermission = "public-read-write" | "public-read" | "private";

export type UserPermission = "view" | "edit";

export const docPermissionLabels = new Map<DocPermission, string>([
  ["public-read-write", "Anyone can view and edit"],
  ["public-read", "Anyone can view, some can edit"],
  ["private", "Only some can view or edit (coming in beta)"],
]);

export const userPermissionLabels = new Map<UserPermission, string>([
  ["view", "Can view"],
  ["edit", "Can edit"],
]);

export type PermissionData = {
  doc: DocPermission;
  users: Map<string, UserPermission>;
};

/**
 * Diffs the changes between existing room permission data `old` and
 * `newPermissions`. Then applies the changes to the room.
 */
export async function updatePermissionData(
  matrixClient: any,
  roomId: string,
  old: PermissionData,
  newPermissions: PermissionData
) {
  if (old.doc !== newPermissions.doc) {
    if (newPermissions.doc === "private") {
      throw new Error("not implemented");
    }
    await updateMatrixRoomAccess(matrixClient, roomId, newPermissions.doc);
  }
  if (newPermissions.doc === "public-read-write") {
    // for public documents, the user permissions are irrelevant and don't need to be updated
    return;
  }

  for (let [userId, permission] of old.users) {
    const newValue = newPermissions.users.get(userId);
    if (!newValue || newValue !== permission) {
      if (newValue === "edit") {
        // invite + set permission
        await matrixClient.invite(roomId, userId);
      } else {
        // kick
        await matrixClient.kick(roomId, userId);
      }
    }
  }

  for (let [userId, permission] of newPermissions.users) {
    const oldValue = old.users.get(userId);
    if (!oldValue) {
      if (permission === "edit") {
        // invite + set permission
        await matrixClient.invite(roomId, userId);
      }
    }
  }
}
