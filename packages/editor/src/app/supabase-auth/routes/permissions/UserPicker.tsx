import UserPicker from "@atlaskit/user-picker";
import { useCallback, useState } from "react";
import { IntlProvider } from "react-intl-next";

import { SupabaseClientType } from "../../SupabaseSessionStore";
import { User } from "./userUtils";

export function SupabaseUserPicker(props: {
  //   excludeUserId: string;
  supabase: SupabaseClientType;
  updateSelectedUser: (user: User | undefined) => void;
}) {
  const updateSelectedUser = props.updateSelectedUser;
  // State and function for storing & updating the users to display in the user picker.
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);

  async function searchUsers(query: string = "") {
    if (query === "") {
      setDisplayedUsers([]);
    } else {
      const ret = await props.supabase
        .from("workspaces")
        .select("*")
        .eq("is_username", true)
        .ilike("name", query + "%")
        .order("name")
        .limit(10);

      const results: User[] =
        ret.data?.map((result) => ({
          id: result.owner_user_id,
          name: result.name,
        })) || [];

      setDisplayedUsers(results);
    }
  }

  const onChange = useCallback(
    (user: User | User[] | null | undefined) => {
      if (Array.isArray(user)) {
        throw new Error("unexpected");
      }
      updateSelectedUser(user || undefined);
    },
    [updateSelectedUser]
  );

  return (
    <IntlProvider locale="en">
      <UserPicker
        fieldId="add-user"
        width={"auto"}
        allowEmail={true}
        noOptionsMessage={() => null}
        onInputChange={searchUsers}
        onChange={onChange}
        options={displayedUsers}
        menuPosition="fixed"
      />
    </IntlProvider>
  );
}
