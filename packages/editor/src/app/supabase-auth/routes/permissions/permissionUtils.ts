import { SupabaseClientType } from "../../SupabaseSessionStore";
import { User } from "./userUtils";

export type DocPermission = "write" | "read" | "no-access";

// export type UserPermission = "deny" | "read" | "write";

export const docPermissionLabels = new Map<DocPermission, string>([
  ["write", "Anyone can view and edit"],
  ["read", "Anyone can view, some can edit"],
  ["no-access", "Only some can view or edit (coming in beta)"],
]);

export const userPermissionLabels = new Map<DocPermission, string>([
  ["read", "Can view"],
  ["write", "Can edit"],
  ["no-access", "No access"],
]);

export type PermissionData = {
  doc: DocPermission;
  users: Map<
    string,
    {
      user: User;
      permission: DocPermission;
    }
  >;
};

/**
 * Diffs the changes between existing room permission data `old` and
 * `newPermissions`. Then applies the changes to the room.
 */
export async function updatePermissionData(
  supabaseClient: SupabaseClientType,
  internalDocId: string,
  old: PermissionData,
  newPermissions: PermissionData
) {
  if (old.doc !== newPermissions.doc) {
    if (newPermissions.doc === "no-access") {
      throw new Error("not implemented");
    }
    await supabaseClient
      .from("documents")
      .update({
        public_access_level: newPermissions.doc,
      })
      .eq("id", internalDocId)
      .order("id")
      .limit(1);
  }
  // if (newPermissions.doc === "public-read-write") {
  //   // for public documents, the user permissions are irrelevant and don't need to be updated
  //   return;
  // }

  for (let [userId, permission] of old.users) {
    const newValue = newPermissions.users.get(userId);
    if (!newValue) {
      await supabaseClient
        .from("document_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("document_id", internalDocId)
        .order("document_id,user_id")
        .limit(1);
    } else if (newValue !== permission) {
      await supabaseClient
        .from("document_permissions")
        .upsert(
          {
            user_id: userId,
            document_id: internalDocId,
            access_level: newValue.permission,
          },
          {
            onConflict: "document_id,user_id",
            ignoreDuplicates: false,
          }
        )
        .order("document_id,user_id")
        .limit(1);
    }
  }

  for (let [userId, permission] of newPermissions.users) {
    const oldValue = old.users.get(userId);
    if (!oldValue) {
      await supabaseClient
        .from("document_permissions")
        .upsert({
          user_id: userId,
          document_id: internalDocId,
          access_level: permission.permission,
        })
        .order("document_id,user_id")
        .limit(1);
    }
  }
}
